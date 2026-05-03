/**
 * `bitbadges-cli gen-pub-key` — derive the base64-encoded compressed
 * secp256k1 public key for a Cosmos address.
 *
 * Resolution order:
 *   1. Indexer's account record (`/api/v0/users` → `account.publicKey`).
 *      Populated whenever the address has signed in or transacted.
 *   2. Chain LCD (`/cosmos/auth/v1beta1/accounts/<addr>`).
 *      Populated whenever the address has broadcast a tx onchain.
 *   3. ECDSA signature recovery (only if the account has neither).
 *      User signs a small fixed message offline; the CLI iterates the
 *      4 secp256k1 recovery candidates and picks the one whose derived
 *      bb1 address matches `--address`. Never asks for a private key
 *      or mnemonic.
 *
 * Use cases:
 *   - Plug into `gen-tx-payload --no-fetch --public-key <b64>` for
 *     air-gapped flows where the indexer isn't reachable.
 *   - Pre-flight a brand-new account that hasn't broadcast any tx yet
 *     (the indexer will return an empty publicKey for fresh accounts).
 *   - Print the bb1 + 0x form of an address from a single source of
 *     truth.
 *
 * EVM N/A: EVM signing doesn't carry a separate Cosmos pubkey in
 * AuthInfo — the secp256k1 key is recovered per-tx from the EVM tx's
 * own signature.
 */

import { Command } from 'commander';
import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { NETWORK_CONFIGS } from '../../signing/types.js';
import { convertToBitBadgesAddress, convertToEthAddress, cosmosAddressFromPublicKey } from '../../address-converter/converter.js';

/**
 * Canonical message used for the recovery flow. Distinct from any
 * Blockin / SIWBB challenge so a user signing this CANNOT have their
 * signature replayed against `/auth/verify`. Stable across versions —
 * the CLI on the recovery side reconstructs the exact ADR-36 envelope
 * from this string.
 */
const PUBKEY_DERIVATION_MESSAGE =
  'BitBadges public key derivation. This signature is used only to derive your public key for offline signing. No transaction is being created or authorized, no session is being granted, and this signature has no validity outside this CLI flow.';

function normalizeIndexerBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return /\/api\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/api/v0`;
}

interface LookupResult {
  found?: string;
  /** True when the source replied "no pubkey on file"; false when the source is unreachable. */
  reachable: boolean;
  warning?: string;
}

async function lookupViaIndexer(baseUrl: string, apiKey: string | undefined, address: string): Promise<LookupResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  try {
    const res = await fetch(`${normalizeIndexerBase(baseUrl)}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accountsToFetch: [{ address }] }),
    });
    if (!res.ok) {
      return { reachable: false, warning: `indexer responded ${res.status} (${baseUrl})` };
    }
    const body = await res.json();
    const acct = (body?.accounts ?? [])[0];
    const key = acct?.publicKey?.key ?? acct?.publicKey;
    if (typeof key === 'string' && key.length > 0) return { found: key, reachable: true };
    return { reachable: true };
  } catch (err: any) {
    return { reachable: false, warning: `indexer unreachable: ${err?.message || err}` };
  }
}

async function lookupViaChainLCD(nodeUrl: string, address: string): Promise<LookupResult> {
  try {
    const res = await fetch(`${nodeUrl.replace(/\/$/, '')}/cosmos/auth/v1beta1/accounts/${encodeURIComponent(address)}`);
    if (!res.ok) {
      return { reachable: false, warning: `chain LCD responded ${res.status} (${nodeUrl})` };
    }
    const body = await res.json();
    // Account shape varies by chain — the BitBadges chain wraps in BaseAccount.
    // Common paths:
    //   account.pub_key.key                          (cosmos-sdk vanilla)
    //   account.base_account.pub_key.key             (vesting / module accts)
    //   account.value.public_key.key                 (legacy)
    const candidates: any[] = [
      body?.account?.pub_key?.key,
      body?.account?.base_account?.pub_key?.key,
      body?.account?.value?.public_key?.key,
      body?.account?.public_key?.key,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 0) return { found: c, reachable: true };
    }
    return { reachable: true };
  } catch (err: any) {
    return { reachable: false, warning: `chain LCD unreachable: ${err?.message || err}` };
  }
}

/**
 * Reconstruct the ADR-36 amino sign-doc bytes the wallet signed.
 *
 * Keplr's `signArbitrary(chainId, address, data)` constructs:
 *   {
 *     chain_id: "",
 *     account_number: "0",
 *     sequence: "0",
 *     fee: { gas: "0", amount: [] },
 *     msgs: [{ type: "sign/MsgSignData", value: { signer, data: <base64-of-data> } }],
 *     memo: "",
 *   }
 * Then JSON-canonicalizes (alphabetically sorted keys, no whitespace),
 * UTF-8 encodes, sha256s, and signs the digest. We replay the same.
 */
function buildAdr36SignBytes(signer: string, message: string): Uint8Array {
  const dataBase64 = Buffer.from(message, 'utf8').toString('base64');
  const signDoc = {
    account_number: '0',
    chain_id: '',
    fee: { amount: [], gas: '0' },
    memo: '',
    msgs: [
      {
        type: 'sign/MsgSignData',
        value: { data: dataBase64, signer },
      },
    ],
    sequence: '0',
  };
  const canonical = canonicalizeJson(signDoc);
  return Buffer.from(canonical, 'utf8');
}

function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalizeJson).join(',') + ']';
  const keys = Object.keys(value as object).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalizeJson((value as any)[k])).join(',') + '}';
}

async function recoverPubKey(message: string, signatureBase64: string, expectedAddress: string): Promise<string> {
  const signBytes = buildAdr36SignBytes(expectedAddress, message);
  const { createHash } = await import('crypto');
  const digest = createHash('sha256').update(signBytes).digest();

  const sigBytes = Buffer.from(signatureBase64, 'base64');
  if (sigBytes.length !== 64) {
    throw new Error(`Expected 64-byte signature (R || S), got ${sigBytes.length} bytes. Cosmos ADR-36 sigs do not include a recovery byte.`);
  }
  const r = '0x' + sigBytes.subarray(0, 32).toString('hex');
  const s = '0x' + sigBytes.subarray(32, 64).toString('hex');

  // ethers v6 — Signature.from accepts {r, s, v}; v ∈ {27, 28} for valid recoveries.
  // SigningKey.recoverPublicKey returns 0x04-prefixed uncompressed (65 bytes).
  // SigningKey.computePublicKey(uncompressed, true) returns the 33-byte compressed form.
  const ethers = await import('ethers');

  for (const v of [27, 28]) {
    try {
      const sig = ethers.Signature.from({ r, s, v });
      const uncompressed = ethers.SigningKey.recoverPublicKey(digest, sig); // 0x04...
      const compressed = ethers.SigningKey.computePublicKey(uncompressed, true); // 0x02.../0x03...
      const compressedHex = compressed.startsWith('0x') ? compressed.slice(2) : compressed;
      const derivedBb1 = cosmosAddressFromPublicKey(compressedHex);
      if (derivedBb1 === expectedAddress) {
        return Buffer.from(compressedHex, 'hex').toString('base64');
      }
    } catch {
      // Some recovery IDs produce invalid points; skip.
    }
  }

  throw new Error(
    `Could not recover a public key matching ${expectedAddress} from the supplied signature. ` +
      'Verify (a) the signature is base64-encoded, (b) the address is the one that produced the signature, and (c) you signed the canonical message exactly as printed.'
  );
}

export const genPubKeyCommand = new Command('gen-pub-key')
  .description('Derive a Cosmos public key from a bb1 address (or recover via signature for fresh accounts).')
  .summary('Cosmos pub key from address — indexer / chain lookup, recovery as fallback.')
  .requiredOption('--address <addr>', 'Cosmos bb1 address (or 0x... — will be converted). EVM-only addresses N/A: EVM signing recovers the pubkey per-tx.')
  .option('--signature <b64>', 'Skip lookups and recover from this signature. Pair with --message if not signing the canonical CLI message.')
  .option('--message <text>', 'Custom message that was signed. Defaults to the canonical CLI derivation message printed by --print-message.')
  .option('--print-message', 'Print the canonical message your wallet should sign for the recovery flow, then exit.')
  .option('--no-lookup', 'Skip the indexer + chain LCD lookups; force the signature-recovery path.');
addNetworkOptions(genPubKeyCommand);
genPubKeyCommand.action(async (opts) => {
  // --print-message: tell the user exactly what to sign.
  if (opts.printMessage) {
    process.stdout.write(PUBKEY_DERIVATION_MESSAGE + '\n');
    return;
  }

  // Normalize address. 0x... → bb1; bb1... → bb1; anything else → error.
  let address: string;
  try {
    address = convertToBitBadgesAddress(String(opts.address));
    if (!address) throw new Error('not a valid address');
  } catch (err: any) {
    process.stderr.write(`Invalid --address: ${err?.message || err}\n`);
    process.exit(2);
  }

  const networkName = resolveNetwork(opts);
  const baseUrl = getApiUrl(opts);
  const apiKey = getApiKeyForNetwork(opts);
  const nodeUrl = (opts as any).nodeUrl || NETWORK_CONFIGS[networkName].nodeUrl;

  // 1. Lookup paths (skipped if --no-lookup or --signature was passed).
  let pubKey: string | undefined;
  let source: 'indexer' | 'chain' | 'signature' | undefined;
  const warnings: string[] = [];

  if (opts.lookup !== false && !opts.signature) {
    const indexerRes = await lookupViaIndexer(baseUrl, apiKey, address);
    if (indexerRes.found) {
      pubKey = indexerRes.found;
      source = 'indexer';
    } else if (indexerRes.warning) {
      warnings.push(indexerRes.warning);
    }
    if (!pubKey) {
      const chainRes = await lookupViaChainLCD(nodeUrl, address);
      if (chainRes.found) {
        pubKey = chainRes.found;
        source = 'chain';
      } else if (chainRes.warning) {
        warnings.push(chainRes.warning);
      }
    }
  }

  // 2. Signature recovery fallback.
  if (!pubKey) {
    if (!opts.signature) {
      const warnSection = warnings.length > 0
        ? `Lookup warnings:\n${warnings.map((w) => `  - ${w}`).join('\n')}\n\n`
        : '';
      process.stderr.write(
        `Public key not found in the indexer (${baseUrl}) or chain LCD (${nodeUrl}).\n` +
          'This typically means the address has never broadcast a tx or signed in.\n\n' +
          warnSection +
          'To derive the pub key offline:\n' +
          '  1. Sign this exact message with your wallet (Keplr signArbitrary, hardware wallet, or any ADR-36-capable signer):\n\n' +
          `    ${PUBKEY_DERIVATION_MESSAGE}\n\n` +
          '  2. Re-run with the resulting base64 signature:\n' +
          `     bitbadges-cli gen-pub-key --address ${address} --signature <base64>\n\n` +
          '  Print the message verbatim with: bitbadges-cli gen-pub-key --print-message\n'
      );
      process.exit(2);
    }
    const message = String(opts.message ?? PUBKEY_DERIVATION_MESSAGE);
    try {
      pubKey = await recoverPubKey(message, String(opts.signature), address);
      source = 'signature';
    } catch (err: any) {
      process.stderr.write(`${err?.message || err}\n`);
      process.exit(1);
    }
  }

  // 3. Compute address forms for output convenience.
  let bb1Address = '';
  let ethAddress = '';
  try {
    bb1Address = address;
    ethAddress = convertToEthAddress(address);
  } catch {
    // Some addresses (e.g. derived from non-secp256k1 keys) don't have a stable EVM form. Best effort.
  }

  process.stdout.write(JSON.stringify({
    pubKey,
    bb1Address,
    ethAddress,
    source,
  }, null, 2) + '\n');
});
