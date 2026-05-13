/**
 * Builds the chain-binary tx command the user should run for keyring-backed
 * signing. We deliberately PRINT this rather than spawn the binary:
 *
 *   - Keyring backends (os | file | test | pass | kwallet) each have their
 *     own TTY / IPC contracts — forwarding stdio across all of them adds
 *     one fragile bug per backend.
 *   - `flags.AddTxFlagsToCmd` attaches ~20 standard Cosmos SDK flags
 *     (--gas, --gas-prices, --gas-adjustment, --fees, --memo, --dry-run,
 *     --generate-only, --offline, etc). Wrapping that is endless and
 *     creates a leaky abstraction the user has to learn around.
 *   - Auditability: humans and agents both benefit from reviewing the
 *     exact signing command before it touches a real key. Burner/browser
 *     paths sign with throwaway material; keyring signs with the user's
 *     actual identity — paranoia is justified.
 *   - `tx.GenerateOrBroadcastTxCLI` (used by every `tx tokenization *`
 *     subcommand) already handles gas estimation, signing, broadcast,
 *     and tx-hash output. Reimplementing that in Node would be a
 *     regression.
 *
 * `bb build` already produces the inner Msg JSON shape that each
 * `tx tokenization <verb> [tx-json-or-file]` subcommand expects, so all
 * we do here is extract `value`, write it to a tmp file, and compose
 * the command line.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/**
 * Subset of typeUrls whose chain-binary subcommand accepts a single
 * `[tx-json-or-file]` positional. These are the verbs `bb build` emits;
 * the chain binary parses the JSON directly via `jsonpb.UnmarshalString`,
 * so we hand it the inner `value` blob untouched.
 *
 * Positional-arg verbs (`cast-vote`, `delete-collection`, etc.) are
 * intentionally NOT in this table — they need custom flag plumbing per
 * msg type, and the user can construct those by hand.
 */
const TYPE_URL_TO_SUBCOMMAND: Record<string, string> = {
  '/tokenization.MsgCreateCollection': 'create-collection',
  '/tokenization.MsgUpdateCollection': 'update-collection',
  '/tokenization.MsgUniversalUpdateCollection': 'universal-update-collection',
  '/tokenization.MsgTransferTokens': 'transfer-tokens',
  '/tokenization.MsgSetManager': 'set-manager',
  '/tokenization.MsgCreateAddressLists': 'create-address-lists',
  '/tokenization.MsgSetCustomData': 'set-setcustomdata',
  '/tokenization.MsgSetCollectionMetadata': 'set-setcollectionmetadata',
  '/tokenization.MsgSetStandards': 'set-setstandards',
  '/tokenization.MsgSetCollectionApprovals': 'set-setcollectionapprovals',
  '/tokenization.MsgSetValidTokenIds': 'set-valid-token-ids',
  '/tokenization.MsgSetIsArchived': 'set-setisarchived',
  '/tokenization.MsgUpdateUserApprovals': 'update-user-approved-transfers',
  '/tokenization.MsgSetTokenMetadata': 'set-settokenmetadata'
};

/** Per-network RPC + chain-id used as `--node` and `--chain-id`. */
const CHAIN_BINARY_NETWORK: Record<'mainnet' | 'testnet' | 'local', { rpc: string; chainId: string }> = {
  mainnet: { rpc: 'https://rpc.bitbadges.io:443', chainId: 'bitbadges-1' },
  testnet: { rpc: 'https://rpc-testnet.bitbadges.io:443', chainId: 'bitbadges-2' },
  local: { rpc: 'http://localhost:26657', chainId: 'bitbadges-1' }
};

export interface KeyringCommandOptions {
  msg: { typeUrl: string; value: unknown };
  from: string;
  network: 'mainnet' | 'testnet' | 'local';
  binary: string;
  keyringBackend: string;
  gas: string;
  gasAdjustment: string;
  /** Optional manager backfill for create-collection — applied to `msg.value.manager` if missing. */
  manager?: string;
  /** Override the auto-derived RPC URL. */
  nodeUrl?: string;
  /** Override the auto-derived chain ID. */
  chainId?: string;
  /** Where to write the message JSON. Defaults to `${os.tmpdir()}/bb-msg-<rand>.json`. */
  msgFilePath?: string;
}

export interface KeyringCommandResult {
  /** Subcommand name, e.g. `create-collection`. */
  subcommand: string;
  /** Absolute path the message JSON was written to. */
  msgFilePath: string;
  /** Multi-line command string suitable for `process.stderr.write`. */
  commandLine: string;
}

/**
 * Build the printable keyring-signing command for a single Msg.
 * Writes the inner `value` to a tmp file as a side effect.
 *
 * Throws on unsupported typeUrls or unparseable shapes; caller is
 * expected to catch and convert to a CLI error.
 */
export function buildKeyringCommand(opts: KeyringCommandOptions): KeyringCommandResult {
  const subcommand = TYPE_URL_TO_SUBCOMMAND[opts.msg.typeUrl];
  if (!subcommand) {
    const supported = Object.keys(TYPE_URL_TO_SUBCOMMAND).sort().join('\n  - ');
    throw new Error(
      `--with-keyring does not support typeUrl "${opts.msg.typeUrl}" (it has no [tx-json-or-file] chain-binary subcommand).\n` +
        `Supported verbs:\n  - ${supported}\n` +
        `For positional-arg msgs (cast-vote, delete-collection, etc.) run \`${opts.binary} tx tokenization --help\` and compose the command manually.`
    );
  }

  // Backfill manager on create-collection to match the burner/browser path.
  const value: Record<string, unknown> =
    opts.msg.value && typeof opts.msg.value === 'object' ? { ...(opts.msg.value as Record<string, unknown>) } : {};
  if (opts.manager && !value.manager && opts.msg.typeUrl === '/tokenization.MsgCreateCollection') {
    value.manager = opts.manager;
  }

  const msgFilePath =
    opts.msgFilePath ?? path.join(os.tmpdir(), `bb-msg-${crypto.randomBytes(4).toString('hex')}.json`);
  fs.writeFileSync(msgFilePath, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });

  const network = CHAIN_BINARY_NETWORK[opts.network];
  const chainId = opts.chainId ?? network.chainId;
  const nodeUrl = opts.nodeUrl ?? network.rpc;

  // Multi-line for terminal readability. Each continuation line is
  // indented 4 spaces; the final --yes line has no trailing backslash
  // so an accidental extra newline doesn't break the paste.
  const commandLine = [
    `${opts.binary} tx tokenization ${subcommand} ${msgFilePath} \\`,
    `    --from ${opts.from} \\`,
    `    --chain-id ${chainId} \\`,
    `    --node ${nodeUrl} \\`,
    `    --keyring-backend ${opts.keyringBackend} \\`,
    `    --gas ${opts.gas} --gas-adjustment ${opts.gasAdjustment} \\`,
    `    --yes`
  ].join('\n');

  return { subcommand, msgFilePath, commandLine };
}

/** Surface the supported set so tests + help text stay in sync. */
export const KEYRING_SUPPORTED_TYPE_URLS: readonly string[] = Object.freeze(Object.keys(TYPE_URL_TO_SUBCOMMAND));
