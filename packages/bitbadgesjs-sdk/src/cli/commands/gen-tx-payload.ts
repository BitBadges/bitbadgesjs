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
  .requiredOption('--from <address>', 'Signer address (bb1.../0x...). Used to fetch account info and select payload shape. With 0x... → emits evmTx (and signDirect if a public key is on chain). With bb1... → emits signDirect; add --with-evm-tx to also emit evmTx.')
  .option('--evm-from <0x...>', 'Use this EVM address for the evmTx payload alongside a bb1 sender. Implies --with-evm-tx.')
  .option('--with-evm-tx', 'Force-emit the evmTx precompile call alongside the Cosmos payloads. Useful when --from is bb1 and you also want a ready-to-send EVM tx.')
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
  // --evm-from is set explicitly OR --with-evm-tx is set with a bb1 --from).
  const fromIsEvm = String(opts.from).startsWith('0x');
  const senderAddress: string = fromIsEvm
    ? evmToCosmosAddress(opts.from, 'bb')
    : opts.from;
  // EVM address resolution:
  //  - explicit --evm-from wins
  //  - else if --from is 0x..., use that
  //  - else if --with-evm-tx is set, derive from bb1 sender via cosmosToEthAddress (best-effort; user can override)
  let evmAddress: string | undefined = opts.evmFrom ?? (fromIsEvm ? opts.from : undefined);
  if (!evmAddress && opts.withEvmTx) {
    // bb1 → 0x derivation. The SDK's converter handles this.
    try {
      const { convertToEthAddress } = await import('../../address-converter/converter.js');
      evmAddress = convertToEthAddress(senderAddress);
    } catch (err: any) {
      process.stderr.write(`Failed to derive EVM address from ${senderAddress}: ${err?.message || err}\n`);
      process.stderr.write('Pass --evm-from 0x... explicitly.\n');
      process.exit(2);
    }
  }

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
        if (!publicKey && info.publicKey) publicKey = info.publicKey;
      } catch (err: any) {
        process.stderr.write(`Indexer fetch failed: ${err?.message || err}\n`);
        process.stderr.write('If running offline, pass --no-fetch with --account-number and --sequence (and --public-key if you want Cosmos sign payloads).\n');
        process.exit(1);
      }
    }
  }

  if (accountNumber === undefined || sequence === undefined) {
    process.stderr.write('Missing --account-number / --sequence. Re-run without --no-fetch, or supply both flags.\n');
    process.exit(2);
  }

  // publicKey is required for Cosmos sign payloads (signDirect, legacyAmino).
  // It's NOT required if only evmTx is wanted — i.e. when --from is 0x...
  // and there's no public key on file yet (Privy-only sign-in). In that
  // case, drop the cosmos sender so createTransactionPayload only emits
  // evmTx — the EVM tx is self-signing (no separate pubkey for the
  // Cosmos AuthInfo).
  const wantCosmosPayloads = !!publicKey;
  if (!wantCosmosPayloads && !evmAddress) {
    process.stderr.write(
      'No public key available for ' + senderAddress + ' and no EVM address provided. ' +
      'Either:\n' +
      '  • Pass --public-key <b64> (for Cosmos signDirect/legacyAmino), or\n' +
      '  • Use an EVM address via --from 0x... or --evm-from 0x... (emits evmTx only).\n'
    );
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
        ...(wantCosmosPayloads
          ? {
              sender: {
                address: senderAddress,
                sequence: sequence,
                accountNumber: accountNumber,
                publicKey: publicKey!,
              },
            }
          : {}),
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
  const envelope: any = {
    chain: evmAddress ? (wantCosmosPayloads ? 'cosmos+evm' : 'evm') : 'cosmos',
    chainId,
    fee: { amount: fee, denom, gas },
    memo,
    messages: messagesInput,
  };
  if (wantCosmosPayloads) {
    envelope.sender = { address: senderAddress, accountNumber: String(accountNumber), sequence: String(sequence), publicKey };
    envelope.signDirect = {
      bodyBytes: bytesToBase64(payload.signDirect.body.toBinary()),
      authInfoBytes: bytesToBase64(payload.signDirect.authInfo.toBinary()),
      signBytes: payload.signDirect.signBytes,
    };
    envelope.legacyAmino = {
      bodyBytes: bytesToBase64(payload.legacyAmino.body.toBinary()),
      authInfoBytes: bytesToBase64(payload.legacyAmino.authInfo.toBinary()),
      signBytes: payload.legacyAmino.signBytes,
    };
  }
  if (evmAddress) {
    envelope.evmAddress = evmAddress;
  }
  if (payload.evmTx) {
    // Augment the precompile call with everything an external EVM signer
    // (ethers/viem/hardware) needs to construct an EIP-1559 tx without
    // re-fetching anything: chainId, recommended gasLimit, and a hint
    // string for the precompile function.
    envelope.evmTx = {
      ...payload.evmTx,
      chainId: NETWORK_CONFIGS[networkName].evmChainId,
      gasLimit: gas,
    };
  }
  // Broadcast endpoint hint so callers don't have to know our routes.
  envelope.broadcastEndpoint = `${normalizeIndexerBase(baseUrl)}/broadcast`;
  envelope.instructions = [
    ...(wantCosmosPayloads ? [
      'Cosmos signing — pick one mode:',
      '  SIGN_MODE_DIRECT: sign signDirect.signBytes; assemble TxRaw{bodyBytes, authInfoBytes, [signature]} and POST to broadcastEndpoint.',
      '  SIGN_MODE_AMINO:  sign legacyAmino.signBytes (for hardware wallets that already speak amino).',
    ] : []),
    ...(payload.evmTx ? [
      'EVM signing — build an EIP-1559 tx with: { chainId: evmTx.chainId, to: evmTx.to, data: evmTx.data, value: evmTx.value, gasLimit: evmTx.gasLimit }, sign with your EVM key, send via any RPC.',
    ] : []),
    'Need a tx-bytes-only flow without managing TxRaw assembly? Use `bitbadges-cli deploy --browser --sign-only` instead — that hands the wallet the signing UI and returns ready-to-broadcast bytes.',
  ];

  process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
});
