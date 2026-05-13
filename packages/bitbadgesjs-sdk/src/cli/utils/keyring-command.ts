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
  const jsonArgSubcommand = TYPE_URL_TO_SUBCOMMAND[opts.msg.typeUrl];
  const positionalBuilder = POSITIONAL_BUILDERS[opts.msg.typeUrl];

  if (!jsonArgSubcommand && !positionalBuilder) {
    const supported = [
      ...Object.keys(TYPE_URL_TO_SUBCOMMAND),
      ...Object.keys(POSITIONAL_BUILDERS)
    ].sort().join('\n  - ');
    throw new Error(
      `--with-keyring does not support typeUrl "${opts.msg.typeUrl}" — no chain-binary subcommand mapping.\n` +
        `Supported verbs:\n  - ${supported}\n` +
        `For unmapped msgs run \`${opts.binary} tx tokenization --help\` and compose the command manually.`
    );
  }

  // Backfill manager on create-collection to match the burner/browser path.
  const value: Record<string, unknown> =
    opts.msg.value && typeof opts.msg.value === 'object' ? { ...(opts.msg.value as Record<string, unknown>) } : {};
  if (opts.manager && !value.manager && opts.msg.typeUrl === '/tokenization.MsgCreateCollection') {
    value.manager = opts.manager;
  }

  const network = CHAIN_BINARY_NETWORK[opts.network];
  const chainId = opts.chainId ?? network.chainId;
  const nodeUrl = opts.nodeUrl ?? network.rpc;

  // For JSON-arg msgs the whole `value` is written to a single tmp file
  // and passed as the lone positional. For positional msgs (set-*-approval
  // takes a sub-JSON for the approval field; others take only scalars),
  // the builder writes whatever JSON it needs via the `writeJson` callback.
  let msgFilePath = '';
  let head: string;
  let subcommand: string;
  if (jsonArgSubcommand) {
    msgFilePath =
      opts.msgFilePath ?? path.join(os.tmpdir(), `bb-msg-${crypto.randomBytes(4).toString('hex')}.json`);
    fs.writeFileSync(msgFilePath, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
    head = `${opts.binary} tx tokenization ${jsonArgSubcommand} ${msgFilePath}`;
    subcommand = jsonArgSubcommand;
  } else {
    const writeJson = (data: unknown): string => {
      const p = path.join(os.tmpdir(), `bb-msg-${crypto.randomBytes(4).toString('hex')}.json`);
      fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
      // Track the first-written path so callers / tests can see it.
      if (!msgFilePath) msgFilePath = p;
      return p;
    };
    const parts = positionalBuilder!(value, writeJson);
    head = `${opts.binary} tx tokenization ${parts.join(' ')}`;
    subcommand = parts[0];
  }

  // Multi-line for terminal readability. Each continuation line is
  // indented 4 spaces; the final --yes line has no trailing backslash
  // so an accidental extra newline doesn't break the paste.
  const commandLine = [
    `${head} \\`,
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

// ── Multi-msg support ────────────────────────────────────────────────────
//
// Bounty accept/deny and any future multi-msg flow emit `{messages: [...]}`
// wrappers. The chain binary's `tx tokenization <verb>` subcommands only
// take ONE msg each, so we emit one command per msg and chain them with
// `&&`. Each command signs + broadcasts independently.
//
// Atomicity caveat (recorded so future readers don't re-litigate): the
// chained commands are NOT one atomic tx — if msg N+1 fails on-chain, the
// effect of msgs [1..N] persists. For bounty this is fine: MsgCastVote is
// idempotent (the vote stays cast even if the subsequent transfer fails),
// and the user can re-run just the failing tail. Use the `bb deploy`
// browser/burner paths if you need true atomicity (those build a single
// multi-msg tx via the signing client).

/**
 * Positional-arg msg → chain-binary subcommand line builder. The chain
 * binary's `tx_cast_vote.go` / `tx_set_outgoing_approval.go` etc. take
 * positional arguments, not a JSON blob. We emit the same flag layout
 * the JSON-arg path uses, with positional args inlined.
 *
 * Some verbs (e.g. set-outgoing-approval) accept a JSON-blob as one of
 * the positionals — `writeJson` is provided so builders can write to
 * tmp and pass back the path. The builder records the path in
 * `msgFilePaths` via the `pushTmpFile` callback.
 */
type PositionalBuilder = (
  value: Record<string, unknown>,
  writeJson: (data: unknown) => string
) => string[];

const POSITIONAL_BUILDERS: Record<string, PositionalBuilder> = {
  '/tokenization.MsgCastVote': (v) => {
    // Use: cast-vote [collection-id] [approval-level] [approver-address] [approval-id] [proposal-id] [yes-weight]
    const collectionId = String(v.collection_id ?? v.collectionId ?? '');
    const approvalLevel = String(v.approval_level ?? v.approvalLevel ?? '');
    const approverAddress = String(v.approver_address ?? v.approverAddress ?? '');
    const approvalId = String(v.approval_id ?? v.approvalId ?? '');
    const proposalId = String(v.proposal_id ?? v.proposalId ?? '');
    const yesWeight = String(v.yes_weight ?? v.yesWeight ?? '');
    return [
      'cast-vote',
      shellQuote(collectionId),
      shellQuote(approvalLevel),
      shellQuote(approverAddress),
      shellQuote(approvalId),
      shellQuote(proposalId),
      shellQuote(yesWeight)
    ];
  },
  '/tokenization.MsgSetOutgoingApproval': (v, writeJson) => {
    // Use: set-outgoing-approval [collection-id] [approval-json-or-file]
    const collectionId = String(v.collectionId ?? v.collection_id ?? '');
    const approvalJsonPath = writeJson(v.approval);
    return ['set-outgoing-approval', shellQuote(collectionId), approvalJsonPath];
  },
  '/tokenization.MsgSetIncomingApproval': (v, writeJson) => {
    // Use: set-incoming-approval [collection-id] [approval-json-or-file]
    const collectionId = String(v.collectionId ?? v.collection_id ?? '');
    const approvalJsonPath = writeJson(v.approval);
    return ['set-incoming-approval', shellQuote(collectionId), approvalJsonPath];
  },
  '/tokenization.MsgDeleteOutgoingApproval': (v) => {
    // Use: delete-outgoing-approval [collection-id] [approval-id]
    const collectionId = String(v.collectionId ?? v.collection_id ?? '');
    const approvalId = String(v.approvalId ?? v.approval_id ?? '');
    return ['delete-outgoing-approval', shellQuote(collectionId), shellQuote(approvalId)];
  },
  '/tokenization.MsgDeleteIncomingApproval': (v) => {
    // Use: delete-incoming-approval [collection-id] [approval-id]
    const collectionId = String(v.collectionId ?? v.collection_id ?? '');
    const approvalId = String(v.approvalId ?? v.approval_id ?? '');
    return ['delete-incoming-approval', shellQuote(collectionId), shellQuote(approvalId)];
  }
};

/** Conservative shell-quote for positional args. Wraps in single quotes if any non-safe char is present. */
function shellQuote(s: string): string {
  if (s === '') return "''";
  if (/^[A-Za-z0-9_\-./:@]+$/.test(s)) return s;
  // Escape single quotes via the standard bash idiom.
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export interface KeyringMultiCommandResult {
  /** Absolute paths of any JSON files written (for JSON-arg msgs in the chain). */
  msgFilePaths: string[];
  /** Multi-line command string. Each msg becomes a `bitbadgeschaind tx ...` block; blocks are chained with `&&`. */
  commandLine: string;
}

export interface KeyringMultiCommandOptions {
  messages: Array<{ typeUrl: string; value: unknown }>;
  from: string;
  network: 'mainnet' | 'testnet' | 'local';
  binary: string;
  keyringBackend: string;
  gas: string;
  gasAdjustment: string;
  manager?: string;
  nodeUrl?: string;
  chainId?: string;
}

/**
 * Build the printable command pipeline for a multi-msg tx. Each msg
 * becomes its own `bitbadgeschaind tx tokenization <verb>` invocation;
 * the resulting commands are chained with ` && \` so a failure in one
 * step stops the rest.
 */
export function buildKeyringMultiCommand(opts: KeyringMultiCommandOptions): KeyringMultiCommandResult {
  const network = CHAIN_BINARY_NETWORK[opts.network];
  const chainId = opts.chainId ?? network.chainId;
  const nodeUrl = opts.nodeUrl ?? network.rpc;
  const msgFilePaths: string[] = [];

  const blocks: string[] = [];
  for (let i = 0; i < opts.messages.length; i++) {
    const m = opts.messages[i];
    const jsonArgSubcommand = TYPE_URL_TO_SUBCOMMAND[m.typeUrl];
    const positionalBuilder = POSITIONAL_BUILDERS[m.typeUrl];

    let head: string;
    if (jsonArgSubcommand) {
      // Backfill manager on create-collection (mirrors single-msg path).
      const value: Record<string, unknown> =
        m.value && typeof m.value === 'object' ? { ...(m.value as Record<string, unknown>) } : {};
      if (opts.manager && !value.manager && m.typeUrl === '/tokenization.MsgCreateCollection') {
        value.manager = opts.manager;
      }
      const msgFilePath = path.join(os.tmpdir(), `bb-msg-${crypto.randomBytes(4).toString('hex')}.json`);
      fs.writeFileSync(msgFilePath, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
      msgFilePaths.push(msgFilePath);
      head = `${opts.binary} tx tokenization ${jsonArgSubcommand} ${msgFilePath}`;
    } else if (positionalBuilder) {
      const writeJson = (data: unknown): string => {
        const p = path.join(os.tmpdir(), `bb-msg-${crypto.randomBytes(4).toString('hex')}.json`);
        fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
        msgFilePaths.push(p);
        return p;
      };
      const parts = positionalBuilder((m.value ?? {}) as Record<string, unknown>, writeJson);
      head = `${opts.binary} tx tokenization ${parts.join(' ')}`;
    } else {
      const supported = [...Object.keys(TYPE_URL_TO_SUBCOMMAND), ...Object.keys(POSITIONAL_BUILDERS)].sort();
      throw new Error(
        `--with-keyring: message[${i}] typeUrl "${m.typeUrl}" has no chain-binary subcommand mapping.\n` +
          `Supported:\n  - ${supported.join('\n  - ')}`
      );
    }

    const isLast = i === opts.messages.length - 1;
    const block = [
      `${head} \\`,
      `    --from ${opts.from} \\`,
      `    --chain-id ${chainId} \\`,
      `    --node ${nodeUrl} \\`,
      `    --keyring-backend ${opts.keyringBackend} \\`,
      `    --gas ${opts.gas} --gas-adjustment ${opts.gasAdjustment} \\`,
      // Between blocks: insert `sleep 6 &&` so the next tx's sequence
      // lookup happens after the previous one has committed. Without
      // this, the second tx hits "account sequence mismatch" because
      // the chain binary fetches the sequence at start-of-tx, and the
      // first tx is still in the mempool when the second one fires.
      // Block time is ~5s on BitBadges; 6s is the safe minimum.
      isLast ? '    --yes' : '    --yes && sleep 6 && \\'
    ].join('\n');
    blocks.push(block);
  }

  return { msgFilePaths, commandLine: blocks.join('\n') };
}

/** Positional-arg msg types the keyring path can handle in multi-msg mode. */
export const KEYRING_POSITIONAL_TYPE_URLS: readonly string[] = Object.freeze(Object.keys(POSITIONAL_BUILDERS));
