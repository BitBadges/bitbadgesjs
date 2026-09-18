import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { CreditReceiptLedger } from './ledger.js';

test('durable claim grants one result under concurrent retries and rejects cross-request replay', async () => {
  const db = new Database(':memory:');
  const ledger = new CreditReceiptLedger(db);
  const request = ledger.issue({ wallet: 'wallet', collectionId: '1', provider: 'provider', serviceId: 'service', units: '2' });
  const receipt = { ...request, receiptId: 'HASH:0:0', txHash: 'HASH', height: '10' };
  const results = await Promise.all(Array.from({ length: 20 }, async () => ledger.accept(request.requestId, request.secret, receipt)));
  expect(new Set(results.map((r) => r.entitlementId)).size).toBe(1);
  expect(db.query('SELECT COUNT(*) AS n FROM entitlements').get()).toEqual({ n: 1 });
  expect(() => ledger.accept(request.requestId, 'wrong-secret', receipt)).toThrow();
  const second = ledger.issue({ wallet: 'wallet', collectionId: '1', provider: 'provider', serviceId: 'service', units: '2' });
  expect(() => ledger.accept(second.requestId, second.secret, { ...receipt, requestId: second.requestId })).toThrow();
  const reopened = new CreditReceiptLedger(db);
  expect(reopened.accept(request.requestId, request.secret, receipt)).toEqual(results[0]);
  expect(reopened.replay(request.requestId, request.secret, request.wallet, 'HASH')).toEqual(results[0]);
  expect(() => reopened.replay(request.requestId, request.secret, 'another-wallet', 'HASH')).toThrow();
  expect(() => reopened.replay(request.requestId, request.secret, request.wallet, 'OTHER-HASH')).toThrow();
  db.close();
});

test('independent processes contend on one durable request without duplicate grants', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'credit-ledger-'));
  const path = join(directory, 'claims.sqlite');
  const db = new Database(path);
  try {
    const ledger = new CreditReceiptLedger(db);
    const request = ledger.issue({ wallet: 'wallet', collectionId: '1', provider: 'provider', serviceId: 'service', units: '2' });
    const receipt = { ...request, receiptId: 'HASH:0:0', txHash: 'HASH', height: '10' };
    const source = `import { Database } from 'bun:sqlite'; import { CreditReceiptLedger } from ${JSON.stringify(new URL('./ledger.ts', import.meta.url).href)}; const input = await Bun.stdin.json(); const db = new Database(input.path); const result = new CreditReceiptLedger(db).accept(input.request.requestId, input.request.secret, input.receipt); db.close(); console.log(JSON.stringify(result));`;
    const results = await Promise.all(
      Array.from({ length: 8 }, async () => {
        const child = Bun.spawn([process.execPath, '--eval', source], { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' });
        child.stdin.write(JSON.stringify({ path, request, receipt }));
        child.stdin.end();
        const output = await new Response(child.stdout).text();
        expect(await child.exited).toBe(0);
        return JSON.parse(output);
      })
    );
    expect(new Set(results.map((result) => result.entitlementId)).size).toBe(1);
    expect(db.query('SELECT COUNT(*) AS n FROM entitlements').get()).toEqual({ n: 1 });
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
