import { Database } from 'bun:sqlite';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

type RequestTerms = { wallet: string; collectionId: string; provider: string; serviceId: string; units: string };
type Receipt = RequestTerms & { requestId: string; receiptId: string; txHash: string; height: string };
type Row = RequestTerms & { requestId: string; secretHash: string };
const digest = (secret: string) => createHash('sha256').update(secret).digest();

export class CreditReceiptLedger {
  constructor(private db: Database) {
    db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
    db.exec(`CREATE TABLE IF NOT EXISTS requests (requestId TEXT PRIMARY KEY, secretHash TEXT NOT NULL, wallet TEXT NOT NULL, collectionId TEXT NOT NULL, provider TEXT NOT NULL, serviceId TEXT NOT NULL, units TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS entitlements (requestId TEXT PRIMARY KEY, receiptId TEXT NOT NULL UNIQUE, entitlementId TEXT NOT NULL UNIQUE, txHash TEXT NOT NULL, height TEXT NOT NULL);`);
  }

  issue(terms: RequestTerms) {
    const requestId = randomUUID();
    const secret = randomUUID();
    this.db
      .query('INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(requestId, digest(secret).toString('hex'), terms.wallet, terms.collectionId, terms.provider, terms.serviceId, terms.units);
    return { ...terms, requestId, secret };
  }

  get(requestId: string, secret: string): RequestTerms & { requestId: string } {
    const row = this.db.query('SELECT * FROM requests WHERE requestId = ?').get(requestId) as Row | null;
    if (!row || !timingSafeEqual(Buffer.from(row.secretHash, 'hex'), digest(secret)))
      throw new Error('Unknown request or invalid request credential.');
    const { secretHash, ...terms } = row;
    return terms;
  }

  replay(requestId: string, secret: string, wallet: string, txHash: string) {
    const terms = this.get(requestId, secret);
    if (terms.wallet !== wallet) throw new Error('Request belongs to another customer.');
    const previous = this.db.query('SELECT entitlementId, receiptId, txHash FROM entitlements WHERE requestId = ?').get(requestId) as {
      entitlementId: string;
      receiptId: string;
      txHash: string;
    } | null;
    if (!previous) return null;
    if (previous.txHash !== txHash.toUpperCase()) throw new Error('Request already fulfilled with another transaction.');
    return { entitlementId: previous.entitlementId, receiptId: previous.receiptId };
  }

  accept(requestId: string, secret: string, receipt: Receipt) {
    return this.db
      .transaction(() => {
        const terms = this.get(requestId, secret);
        for (const [key, value] of Object.entries(terms)) {
          if (receipt[key as keyof Receipt] !== value) throw new Error('Receipt does not match the issued service request.');
        }
        const previous = this.db.query('SELECT entitlementId, receiptId FROM entitlements WHERE requestId = ?').get(requestId) as {
          entitlementId: string;
          receiptId: string;
        } | null;
        if (previous) {
          if (previous.receiptId !== receipt.receiptId) throw new Error('Request already fulfilled with another receipt. Do not consume again.');
          return previous;
        }
        const entitlementId = randomUUID();
        this.db
          .query('INSERT INTO entitlements VALUES (?, ?, ?, ?, ?)')
          .run(requestId, receipt.receiptId, entitlementId, receipt.txHash, receipt.height);
        return { entitlementId, receiptId: receipt.receiptId };
      })
      .immediate();
  }
}
