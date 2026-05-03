/**
 * `bitbadges-cli gen-tx-payload` — produce a fully-populated, signable
 * tx payload from a built msg JSON. Output is pipable into any external
 * signer (custom EVM wallet, ethers/viem, hardware wallet, custodial
 * signer) that isn't the chain binary or the browser-bridge.
 *
 * The CLI's "third signing destination": #0373 covers chain-binary,
 * #0375 covers browser wallets, this covers programmatic / agentic
 * signers that want the SignDoc bytes precomputed.
 *
 * Pulls account number + sequence from the indexer based on --from
 * (unless --no-fetch is set), builds the TxBody / AuthInfo / SignDoc
 * with the supplied fee + gas, and emits a JSON envelope with both
 * SIGN_MODE_DIRECT and SIGN_MODE_AMINO sign-bytes plus raw protobuf
 * components.
 */

import * as fs from 'fs';
import { Command } from 'commander';
import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import {
  createBodyWithMultipleMessages,
  createFee,
  createSignerInfo,
  createAuthInfo,
  createSignDoc,
  createStdSignDigestFromProto,
  SIGN_DIRECT,
  LEGACY_AMINO,
} from '../../transactions/messages/transaction.js';
import { NETWORK_CONFIGS } from '../../signing/types.js';

interface MsgEntry {
  typeUrl: string;
  value: Record<string, unknown>;
}

function readMsgInput(opts: { input?: string; msgFile?: string; msgStdin?: boolean }): MsgEntry | MsgEntry[] {
  let raw: string;
  if (opts.msgStdin) {
    raw = fs.readFileSync(0, 'utf-8');
  } else if (opts.msgFile) {
    raw = fs.readFileSync(opts.msgFile, 'utf-8');
  } else if (opts.input) {
    if (opts.input === '-') raw = fs.readFileSync(0, 'utf-8');
    else if (opts.input.startsWith('{') || opts.input.startsWith('[')) raw = opts.input;
    else raw = fs.readFileSync(opts.input, 'utf-8');
  } else if (!process.stdin.isTTY) {
    raw = fs.readFileSync(0, 'utf-8');
  } else {
    throw new Error('No msg input. Pass a positional file/-, --msg-file, --msg-stdin, or pipe via stdin.');
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err: any) {
    throw new Error(`Failed to parse msg JSON: ${err?.message || err}`);
  }
}

function normalizeMessages(input: unknown): MsgEntry[] {
  const arr = Array.isArray(input) ? input : [input];
  for (const m of arr) {
    if (!m || typeof m !== 'object' || typeof (m as any).typeUrl !== 'string' || !(m as any).value) {
      throw new Error('Each message must be `{typeUrl: string, value: object}`. Received: ' + JSON.stringify(m));
    }
  }
  return arr as MsgEntry[];
}

interface FetchedAccountInfo {
  accountNumber: number;
  sequence: number;
  publicKey?: string;
}

async function fetchAccountInfo(baseUrl: string, apiKey: string | undefined, address: string): Promise<FetchedAccountInfo> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ accountsToFetch: [{ address }] }),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch account info for ${address}: HTTP ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  const acct = (body?.accounts ?? [])[0];
  if (!acct) {
    throw new Error(`Indexer returned no account for ${address}. Has it been seen onchain yet?`);
  }
  return {
    accountNumber: Number(acct.accountNumber ?? 0),
    sequence: Number(acct.sequence ?? 0),
    publicKey: acct.publicKey?.key ?? acct.publicKey,
  };
}

function bytesToBase64(b: Uint8Array): string {
  return Buffer.from(b).toString('base64');
}

export const genTxPayloadCommand = new Command('gen-tx-payload')
  .description('Build a fully-populated signable tx payload from a msg JSON. Pipe into any external signer.')
  .summary('Convert msg JSON → SignDoc bytes ready for an external signer.')
  .argument('[input]', 'Msg JSON file path, "-" for stdin, or inline JSON. Accepts a single {typeUrl, value} or an array.')
  .option('--msg-file <path>', 'Read msg JSON from a file')
  .option('--msg-stdin', 'Read msg JSON from stdin')
  .requiredOption('--from <address>', 'Signer address. Determines chain (bb1.../0x...) and is used to fetch account number + sequence.')
  .option('--public-key <b64>', 'Base64 compressed pubkey. Required if not fetched from indexer (--no-fetch) or if account is not yet onchain.')
  .option('--account-number <n>', 'Override account number (skip indexer round-trip for this field)')
  .option('--sequence <n>', 'Override sequence (skip indexer round-trip for this field)')
  .option('--chain-id <id>', 'Chain ID (default per network: bitbadges_50024-1 mainnet, bitbadges_50025-1 testnet, bitbadges_50026-1 stagenet)')
  .option('--memo <text>', 'Optional tx memo', '')
  .option('--fee <amount>', 'Fee amount in base units', '0')
  .option('--fee-denom <denom>', 'Fee denom', 'ubadge')
  .option('--gas <number>', 'Gas limit', '400000')
  .option('--no-fetch', 'Skip the indexer account-info round-trip; require --account-number and --sequence via flags. Useful for offline / air-gapped flows.');
addNetworkOptions(genTxPayloadCommand);
genTxPayloadCommand.action(async (positional: string | undefined, opts: any) => {
  let messagesInput: MsgEntry[];
  try {
    const raw = readMsgInput({ input: positional, msgFile: opts.msgFile, msgStdin: opts.msgStdin });
    messagesInput = normalizeMessages(raw);
  } catch (err: any) {
    process.stderr.write(`${err?.message || err}\n`);
    process.exit(2);
  }

  const networkName = resolveNetwork(opts);
  const baseUrl = getApiUrl(opts);
  const apiKey = getApiKeyForNetwork(opts);
  const chainId = opts.chainId ?? NETWORK_CONFIGS[networkName].cosmosChainId;

  // Account number + sequence — either fetched or provided.
  let accountNumber: number | undefined = opts.accountNumber !== undefined ? Number(opts.accountNumber) : undefined;
  let sequence: number | undefined = opts.sequence !== undefined ? Number(opts.sequence) : undefined;
  let publicKey: string | undefined = opts.publicKey;

  if (opts.fetch !== false) {
    if (accountNumber === undefined || sequence === undefined || !publicKey) {
      try {
        const info = await fetchAccountInfo(baseUrl, apiKey, opts.from);
        if (accountNumber === undefined) accountNumber = info.accountNumber;
        if (sequence === undefined) sequence = info.sequence;
        if (!publicKey) publicKey = info.publicKey;
      } catch (err: any) {
        process.stderr.write(`Indexer fetch failed: ${err?.message || err}\n`);
        process.stderr.write('If running offline, pass --no-fetch with --account-number, --sequence, and --public-key.\n');
        process.exit(1);
      }
    }
  }

  if (accountNumber === undefined || sequence === undefined) {
    process.stderr.write('Missing --account-number / --sequence. Re-run without --no-fetch, or supply both flags.\n');
    process.exit(2);
  }
  if (!publicKey) {
    process.stderr.write('Missing public key. Pass --public-key <b64>, or omit --no-fetch so the indexer can supply it (account must be seen onchain first).\n');
    process.exit(2);
  }

  // Build all the bytes the external signer might need.
  const fee = String(opts.fee ?? '0');
  const denom = String(opts.feeDenom ?? 'ubadge');
  const gas = Number(opts.gas ?? 400000);
  const memo = String(opts.memo ?? '');

  const body = createBodyWithMultipleMessages(messagesInput, memo);
  const feeMessage = createFee(fee, denom, gas);
  const pubKeyBytes = new Uint8Array(Buffer.from(publicKey, 'base64'));

  const directSignerInfo = createSignerInfo(pubKeyBytes, sequence, SIGN_DIRECT);
  const directAuthInfo = createAuthInfo(directSignerInfo, feeMessage);
  const directSignDoc = createSignDoc(body.toBinary(), directAuthInfo.toBinary(), chainId, accountNumber);

  const aminoSignerInfo = createSignerInfo(pubKeyBytes, sequence, LEGACY_AMINO);
  const aminoAuthInfo = createAuthInfo(aminoSignerInfo, feeMessage);
  const aminoSignBytes = createStdSignDigestFromProto(messagesInput, memo, fee, denom, gas, sequence, accountNumber, chainId);

  const envelope = {
    chain: opts.from.startsWith('0x') ? 'evm' : 'cosmos',
    chainId,
    from: opts.from,
    accountNumber: String(accountNumber),
    sequence: String(sequence),
    publicKey,
    fee: { amount: fee, denom, gas: String(gas) },
    memo,
    messages: messagesInput,
    bodyBytes: bytesToBase64(body.toBinary()),
    authInfo: {
      direct: bytesToBase64(directAuthInfo.toBinary()),
      amino: bytesToBase64(aminoAuthInfo.toBinary()),
    },
    signBytes: {
      // SIGN_MODE_DIRECT: protobuf-encoded SignDoc. Sign these bytes.
      direct: bytesToBase64(directSignDoc.toBinary()),
      // SIGN_MODE_AMINO: stable JSON-canonical digest. For hardware wallets.
      amino: aminoSignBytes,
    },
    instructions: {
      direct: 'Sign signBytes.direct with your private key (secp256k1 over keccak256(bytes)). Submit the signature back via `bitbadges-cli api broadcast-tx` or POST /api/v0/broadcast with txBytes built from createTxRaw(bodyBytes, authInfo.direct, [signature]).',
      amino: 'Sign signBytes.amino with your private key (legacy amino path, useful for hardware wallets that already support cosmos amino signing).',
    },
  };

  process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
});
