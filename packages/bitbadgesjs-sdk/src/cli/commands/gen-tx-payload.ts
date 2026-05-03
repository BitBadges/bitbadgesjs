/**
 * `bitbadges-cli gen-tx-payload` — produce a fully-populated, signable
 * tx payload from a built msg JSON. Output is pipable into any external
 * signer (custom EVM wallet, ethers/viem, hardware wallet, custodial
 * signer) that isn't the chain binary or the browser-bridge.
 *
 * Output mirrors the SDK's `createTransactionPayload()` return shape:
 *   - signDirect.{bodyBytes, authInfoBytes, signBytes}     (Cosmos SIGN_MODE_DIRECT)
 *   - legacyAmino.{bodyBytes, authInfoBytes, signBytes}    (Cosmos SIGN_MODE_AMINO, hardware-wallet friendly)
 *   - evmTx.{to, data, value, functionName}                (EVM precompile call, ready for ethers/viem)
 *
 * Cosmos payloads require `--from <bb1...>` plus the public key (auto-
 * fetched from the indexer when the account has been seen onchain).
 * EVM payload is generated when `--evm-from <0x...>` is set, OR when
 * `--from` is itself a 0x-address (in which case the bb1-equivalent is
 * auto-derived for the Cosmos sender).
 */

import * as fs from 'fs';
import { Command } from 'commander';
import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { NETWORK_CONFIGS } from '../../signing/types.js';
import { createTransactionPayload } from '../../transactions/messages/base.js';
import { encodeTokenizationMsgFromJson, supportedTokenizationTypeUrls } from '../../transactions/messages/bitbadges/tokenization/fromJson.js';
import { evmToCosmosAddress } from '../../transactions/precompile/helpers.js';

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
    return JSON.parse(raw);
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

function normalizeIndexerBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return /\/api\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/api/v0`;
}

async function fetchAccountInfo(baseUrl: string, apiKey: string | undefined, address: string): Promise<FetchedAccountInfo> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(`${normalizeIndexerBase(baseUrl)}/users`, {
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
  .summary('Convert msg JSON → SignDoc / EVM tx ready for an external signer.')
  .argument('[input]', 'Msg JSON file path, "-" for stdin, or inline JSON. Accepts a single {typeUrl, value} or an array.')
  .option('--msg-file <path>', 'Read msg JSON from a file')
  .option('--msg-stdin', 'Read msg JSON from stdin')
  .requiredOption('--from <address>', 'Signer address (bb1.../0x...). Used to fetch account info and select payload shape. If 0x... is supplied, the bb1-equivalent is auto-derived for the Cosmos sender and EVM payload is also generated.')
  .option('--evm-from <0x...>', 'Generate EVM payload for this address in addition to the Cosmos sender. Use when you want both signDirect AND evmTx outputs.')
  .option('--public-key <b64>', 'Base64 compressed pubkey. Required if not fetched from indexer (--no-fetch) or if account is not yet onchain.')
  .option('--account-number <n>', 'Override account number (skip indexer round-trip for this field)')
  .option('--sequence <n>', 'Override sequence (skip indexer round-trip for this field)')
  .option('--chain-id <id>', 'Cosmos chain ID override (default per network: bitbadges-1 / etc)')
  .option('--memo <text>', 'Optional tx memo', '')
  .option('--fee <amount>', 'Fee amount in base units', '0')
  .option('--fee-denom <denom>', 'Fee denom', 'ubadge')
  .option('--gas <number>', 'Gas limit', '400000')
  .option('--no-fetch', 'Skip the indexer account-info round-trip; require --account-number, --sequence, and --public-key via flags. Useful for offline / air-gapped flows.');
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

  // Resolve sender / EVM address. The user passes one address via --from;
  // we derive the other when an EVM payload is wanted (--from is 0x... OR
  // --evm-from is set explicitly).
  const fromIsEvm = String(opts.from).startsWith('0x');
  const senderAddress: string = fromIsEvm
    ? evmToCosmosAddress(opts.from, 'bb')
    : opts.from;
  const evmAddress: string | undefined = opts.evmFrom ?? (fromIsEvm ? opts.from : undefined);

  const networkName = resolveNetwork(opts);
  const baseUrl = getApiUrl(opts);
  const apiKey = getApiKeyForNetwork(opts);
  const chainId = opts.chainId ?? NETWORK_CONFIGS[networkName].cosmosChainId;

  // Account number + sequence — either fetched or provided. Always keyed by
  // the bb1 sender, even when the user passed --from 0x...
  let accountNumber: number | undefined = opts.accountNumber !== undefined ? Number(opts.accountNumber) : undefined;
  let sequence: number | undefined = opts.sequence !== undefined ? Number(opts.sequence) : undefined;
  let publicKey: string | undefined = opts.publicKey;

  if (opts.fetch !== false) {
    if (accountNumber === undefined || sequence === undefined || !publicKey) {
      try {
        const info = await fetchAccountInfo(baseUrl, apiKey, senderAddress);
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

  // Convert each {typeUrl, value} JSON into a proto Message via the SDK's
  // tokenization JSON dispatcher. Non-tokenization typeUrls are out of
  // scope for this command — the agent should proto-encode them itself.
  let protoMessages;
  try {
    protoMessages = messagesInput.map((m) => encodeTokenizationMsgFromJson(m));
  } catch (err: any) {
    process.stderr.write(`Failed to encode message: ${err?.message || err}\n`);
    process.stderr.write(`Supported typeUrls: ${supportedTokenizationTypeUrls().join(', ')}\n`);
    process.exit(2);
  }

  // Hand the proto messages to createTransactionPayload — the same SDK
  // function the dashboard's TxModal uses. Returns signDirect +
  // legacyAmino (when sender is set) and evmTx (when evmAddress is set).
  const fee = String(opts.fee ?? '0');
  const denom = String(opts.feeDenom ?? 'ubadge');
  const gas = String(opts.gas ?? 400000);
  const memo = String(opts.memo ?? '');

  let payload;
  try {
    payload = createTransactionPayload(
      {
        sender: {
          address: senderAddress,
          sequence: sequence,
          accountNumber: accountNumber,
          publicKey: publicKey,
        },
        fee: { amount: fee, denom, gas },
        memo,
        chainIdOverride: chainId,
        ...(evmAddress ? { evmAddress } : {}),
      },
      protoMessages
    );
  } catch (err: any) {
    process.stderr.write(`createTransactionPayload failed: ${err?.message || err}\n`);
    process.exit(1);
  }

  // Serialize the proto TxBody / AuthInfo to base64 so the JSON output is
  // self-contained. signBytes is already a string. evmTx is plain JSON.
  const envelope = {
    chain: evmAddress ? (senderAddress ? 'cosmos+evm' : 'evm') : 'cosmos',
    chainId,
    sender: { address: senderAddress, accountNumber: String(accountNumber), sequence: String(sequence), publicKey },
    ...(evmAddress ? { evmAddress } : {}),
    fee: { amount: fee, denom, gas },
    memo,
    messages: messagesInput,
    signDirect: {
      bodyBytes: bytesToBase64(payload.signDirect.body.toBinary()),
      authInfoBytes: bytesToBase64(payload.signDirect.authInfo.toBinary()),
      signBytes: payload.signDirect.signBytes,
    },
    legacyAmino: {
      bodyBytes: bytesToBase64(payload.legacyAmino.body.toBinary()),
      authInfoBytes: bytesToBase64(payload.legacyAmino.authInfo.toBinary()),
      signBytes: payload.legacyAmino.signBytes,
    },
    ...(payload.evmTx ? { evmTx: payload.evmTx } : {}),
    instructions: [
      'signDirect.signBytes is what you sign for SIGN_MODE_DIRECT (Cosmos default).',
      'legacyAmino.signBytes is what hardware wallets sign for SIGN_MODE_AMINO.',
      'evmTx is a precompile call ready for ethers/viem: `signer.sendTransaction({to, data, value})`.',
      'Once signed: rebuild a TxRaw {bodyBytes, authInfoBytes, [signature]} and POST to /api/v0/broadcast.',
    ],
  };

  process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
});
