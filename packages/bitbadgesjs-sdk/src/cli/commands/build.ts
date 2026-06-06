import { Command } from 'commander';
import { readJsonInput, addNetworkOptions } from '../utils/io.js';
import { emit as emitEnvelope, isQuiet, type EnvelopeWarning } from '../utils/envelope.js';
import { tagHelpGroups } from '../utils/help-groups.js';
import { renderReview, renderValidate, renderResolvedMetadata, renderSimulate, collectResolvedEntries, type ResolvedEntry } from '../utils/terminal.js';
import { isCollectionMsg, normalizeToCreateOrUpdate } from '../utils/normalizeMsg.js';
import { addDeployOptions, isDeployRequested, executeDeploy } from '../utils/deploy-options.js';
import { requireBbDenom, DEFAULT_FEE_DENOM } from '../utils/denom.js';
import { requireBb1AddressStrict } from '../utils/address.js';

export const buildCommand = new Command('build').description('Deterministic transaction builders — flag-based generators for vaults, NFTs, subscriptions, bounties, and more. Output: ready-to-sign JSON. To broadcast, pipe into `bb deploy --burner`.');

// ── Output helper ────────────────────────────────────────────────────────────


async function emit(
  data: any,
  opts: {
    condensed?: boolean;
    outputFile?: string;
    jsonOnly?: boolean;
    explain?: boolean;
    creator?: string;
    manager?: string;
    name?: string;
    description?: string;
    image?: string;
    simulate?: boolean;
    events?: boolean;
    // Network selection — passed through addNetworkOptions on the
    // shared sharedOpts() helper. Consulted by --simulate AND
    // --deploy-with-burner.
    network?: 'mainnet' | 'local' | 'testnet';
    testnet?: boolean;
    local?: boolean;
    url?: string;
    nodeUrl?: string;
    apiKey?: string;
    // --deploy-with-burner — broadcast the just-built msg via the
    // ephemeral burner flow, equivalent to piping the JSON output
    // into `bb cli deploy --burner`.
    deployWithBurner?: boolean;
    deployWithBrowser?: boolean;
    signOnly?: boolean;
    frontendUrl?: string;
    open?: boolean;
    timeout?: string | number;
    expectedAddress?: string;
    fund?: 'faucet' | 'manual';
    fee?: string;
    feeDenom?: string;
    gas?: string | number;
    new?: boolean;
    reuse?: string;
    nonInteractive?: boolean;
    pollTimeout?: string | number;
  }
) {
  // User-level approval templates produce
  // `/tokenization.MsgUpdateUserApprovals` and similar — they're not
  // collection CRUD msgs but they still need the creator / manager
  // backfill from CLI flags. Detect once and use the flag in two
  // places below: (a) post-build creator override, (b) gating the
  // auto-simulate path (we skip simulate for approval-style msgs
  // because their semantics are state-change-on-existing-collection
  // with set/append/delete variability — not a single tx the user
  // wants to dry-run on a fresh chain).
  const isUserApprovalTx =
    typeof data?.typeUrl === 'string' &&
    /\.(MsgUpdateUserApprovals|MsgSetIncomingApproval|MsgSetOutgoingApproval|MsgDeleteIncomingApproval|MsgDeleteOutgoingApproval|MsgPurgeApprovals)$/.test(
      data.typeUrl
    );

  // Transfer txs (`bb cli build transfer`) flow through here too. They
  // get auto-validate + auto-simulate, but skip review/metadata/explain
  // (those are collection-specific).
  const isTransferTx =
    typeof data?.typeUrl === 'string' && data.typeUrl === '/tokenization.MsgTransferTokens';

  // Apply --creator / --manager overrides to collection msgs. Builders emit
  // MsgUniversalUpdateCollection internally (superset) — the normalization
  // into MsgCreateCollection / MsgUpdateCollection happens once, at the very
  // end of emit(), right before we write the JSON out.
  const isCollectionTx = isCollectionMsg(data);
  if ((isCollectionTx || isUserApprovalTx || isTransferTx) && data.value) {
    // Approval-style builders (intent / listing / bid / pm-buy-intent /
    // pm-sell-intent) require --address (the user-of-record
    // who owns the approval). The chain also requires a non-empty `creator`
    // on the wrapping MsgUpdateUserApprovals — without it the deploy step
    // emits `creator: ""` and broadcast fails with "creator is required".
    // Default --creator from --address when --creator is omitted, so the
    // happy path is one fewer flag to pass.
    const fallbackCreator = opts.creator || (isUserApprovalTx ? (opts as any).address : undefined);
    if (fallbackCreator) data.value.creator = fallbackCreator;
  }
  if (isCollectionTx && data.value) {
    if (opts.manager) data.value.manager = opts.manager;

    // Defensive backfill — last-mile safety net for templates that
    // generate approvals without knowing the creator address.
    //
    // (1) `initiatedByListId === ''` → fill in with creator. The chain
    //     rejects empty list IDs with "initiated by list id is
    //     uninitialized". Any builder that genuinely wants a permissionless
    //     list must explicitly set `'All'` — empty string is never valid.
    //
    // (2) `coinTransfers[].to === ''` → fill in with creator, BUT only
    //     when `overrideToWithInitiator !== true`. The override flag tells
    //     the chain to substitute `to` with the initiator at runtime
    //     (correct for quest rewards, bounty payouts to claimants, etc.).
    //     The empty `to` without the override means "refund the creator"
    //     — typical for deny/expire branches in bounty/etc. where
    //     the builder couldn't know the creator at build time.
    const creatorForFallback = data.value.creator;
    if (Array.isArray(data.value.collectionApprovals) && creatorForFallback) {
      for (const approval of data.value.collectionApprovals) {
        if (!approval || typeof approval !== 'object') continue;
        if (approval.initiatedByListId === '') {
          approval.initiatedByListId = creatorForFallback;
        }
        const cts = approval.approvalCriteria?.coinTransfers;
        if (Array.isArray(cts)) {
          for (const ct of cts) {
            if (ct && ct.to === '' && ct.overrideToWithInitiator !== true) {
              ct.to = creatorForFallback;
            }
          }
        }
      }
    }
  }

  // Narrow Universal → MsgCreateCollection / MsgUpdateCollection right at
  // the emit boundary. Agents and humans see the proto's real per-intent
  // message type; only legacy internal tooling sees the Universal superset.
  const outData = isCollectionTx ? normalizeToCreateOrUpdate(data) : data;

  // Build the envelope's `meta` payload + `warnings` array as we run
  // each auto-check. Stderr commentary still streams for human UX (gated
  // by --quiet / --json-only); the structured equivalents land in the
  // envelope so agents don't have to scrape stderr text.
  //
  // `--quiet` (and `BB_QUIET=1`) suppresses commentary streams just like
  // `--json-only`, but stays scoped to commentary — actual errors still
  // emit. Use the same gate so the four banners below follow one rule.
  const suppressCommentary = !!opts.jsonOnly || isQuiet();
  const meta: Record<string, unknown> = {};
  const warnings: EnvelopeWarning[] = [];

  // --explain: run interpretTransaction and surface plain-English text.
  // Always computed when applicable so agents see the explanation in
  // meta.explanation; the stderr render is gated by --quiet for humans.
  if (opts.explain && isCollectionTx) {
    try {
      const { interpretTransaction } = await import('../../core/interpret-transaction.js');
      const explanation = interpretTransaction(data.value);
      meta.explanation = explanation;
      if (!isQuiet()) {
        process.stderr.write('\n── Explanation ──\n' + explanation + '\n');
      }
    } catch (err) {
      if (!suppressCommentary) {
        process.stderr.write(`Explain skipped: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }
  }

  // Auto-validate runs for collection / user-approval / transfer msgs
  // — anything structurally validatable. Always computed (so agents see
  // validation results in meta.validation); stderr render gated by quiet.
  if (isCollectionTx || isUserApprovalTx || isTransferTx) {
    try {
      const { validateTransaction } = await import('../../core/validate.js');
      const wrapped = { messages: [data] };
      const vResult = validateTransaction(wrapped);
      meta.validation = vResult;
      for (const issue of vResult?.issues ?? []) {
        warnings.push({
          code: `validate.${(issue as any).code ?? 'issue'}`,
          message: (issue as any).message ?? 'validation issue',
          details: issue
        });
      }
      if (!suppressCommentary) {
        process.stderr.write('\n' + renderValidate(vResult, { stream: process.stderr, title: 'Auto-Validate' }) + '\n');
      }
    } catch (err) {
      if (!suppressCommentary) {
        process.stderr.write(`Validation skipped: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }
  }

  if (isCollectionTx) {
    try {
      const { reviewCollection } = await import('../../core/review.js');
      // reviewCollection wants either a raw collection or a tx body with
      // messages[]. Templates emit a single Msg, so wrap it.
      const result = reviewCollection({ messages: [data] });
      meta.review = result;
      // Map each finding into the envelope's warnings array so callers
      // that only inspect `.warnings` see the design review surface too.
      for (const finding of result?.findings ?? []) {
        warnings.push({
          code: finding.code,
          message: (finding.title?.en ?? finding.code),
          details: finding
        });
      }
      if (!suppressCommentary) {
        process.stderr.write('\n' + renderReview(result, { stream: process.stderr, title: 'Auto-Review' }) + '\n');
      }
    } catch (err) {
      if (!suppressCommentary) {
        process.stderr.write(`Review skipped: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }

    // Resolved Metadata — final on-chain (uri, customData) pairs for
    // every metadata-bearing entity. We also surface a `metadataToUpload`
    // list (URI-mode entries only) — that's the actionable subset agents
    // need to push to IPFS *before* deploy. Per
    // [[feedback_ai_cli_first_exposure]] off-chain storage stays
    // website-only, so an agent can't IPFS-upload directly; the list
    // tells them exactly which URIs to feed through the upload UI.
    try {
      const entries: ResolvedEntry[] = collectResolvedEntries(data);
      meta.resolvedMetadata = entries;
      meta.metadataToUpload = entries
        .filter((e) => e.uri.length > 0)
        .map((e) => ({ kind: e.kind, location: e.location, uri: e.uri }));
      if (!suppressCommentary) {
        process.stderr.write('\n' + renderResolvedMetadata(data, { stream: process.stderr }) + '\n');
      }
    } catch (err) {
      if (!suppressCommentary) {
        process.stderr.write(`Resolved-metadata preview skipped: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }
  }

  // Auto-Simulate — opt-in via --simulate. Posts to the BitBadges API's
  // /api/v0/simulate endpoint via simulateMessages(). Returns gasUsed +
  // parsed events + per-address net balance changes. Skips gracefully
  // if no API key is configured rather than hard-failing.
  //
  // Honors --network/--local/--testnet/--url so a `templates vault
  // --simulate --network local` flow lands on the local indexer
  // automatically.
  //
  // Lives OUTSIDE the collection-only block so transfers (which can't
  // be reviewed but CAN be simulated end-to-end) reach it. User-approval
  // txs get a skip note further down.
  if (opts.simulate && (isCollectionTx || isTransferTx)) {
    try {
      const { getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
      const apiKey = getApiKeyForNetwork(opts);
      if (!apiKey) {
        const skipResult = {
          success: false,
          error:
            'Auto-Simulate skipped — no API key. Pass --api-key or run `bb settings set apiKey <key>`.'
        };
        meta.simulate = skipResult;
        warnings.push({
          code: 'simulate.skipped',
          message: skipResult.error
        });
        if (!suppressCommentary) {
          process.stderr.write(
            '\n' + renderSimulate(skipResult, { stream: process.stderr, title: 'Auto-Simulate' }) + '\n'
          );
        }
      } else {
        const { simulateMessages } = await import('../../builder/tools/queries/simulateTransaction.js');
        const { prefetchSimulateCollections } = await import('../utils/simulateSymbols.js');
        // For transfer txs, the signer is `data.value.creator`. For
        // collection builders, fall back to --creator.
        const simulateCreator = isTransferTx ? data?.value?.creator : opts.creator;
        const result = await simulateMessages({
          messages: [data],
          creatorAddress: simulateCreator,
          apiKey,
          apiUrl: getApiUrl(opts)
        });
        meta.simulate = result;
        if (!suppressCommentary) {
          const collectionCache = await prefetchSimulateCollections(result, {
            apiKey,
            apiUrl: getApiUrl(opts)
          });
          process.stderr.write(
            '\n' +
              renderSimulate(result, {
                stream: process.stderr,
                title: 'Auto-Simulate',
                events: opts.events ? 'full' : 'count',
                collectionCache
              }) +
              '\n'
          );
        }
      }
    } catch (err) {
      if (!suppressCommentary) {
        process.stderr.write(`Simulation skipped: ${err instanceof Error ? err.message : String(err)}\n`);
      }
    }
  }

  // Approval-template auto-simulate skip — sits OUTSIDE the
  // collection-only block so it fires even when isCollectionTx is
  // false. Approval msgs already get the Auto-Validate run above; we
  // print the skip note once so the user understands why no gas is
  // shown.
  if (opts.simulate && isUserApprovalTx) {
    warnings.push({
      code: 'simulate.unsupported',
      message:
        'Auto-Simulate skipped — wrap user-level approvals inside an alternative approval message to simulate end-to-end.'
    });
    if (!suppressCommentary) {
      process.stderr.write(
        '\nAuto-Simulate skipped — wrap user-level approvals inside an alternative approval message to simulate end-to-end. Auto-Validate ran above.\n'
      );
    }
  }

  // Emit the single envelope last so the human-eye lands on the JSON
  // verdict after the streamed commentary. Stdout flushes synchronously
  // for pipes/files and line-buffered for TTYs, so the visible order
  // stays stable across both cases. The data slot remains the unmodified
  // {typeUrl, value} msg so `bb build | bb deploy` keeps working with
  // zero envelope-aware parsing on the deploy side.
  emitEnvelope(outData, {
    condensed: opts.condensed,
    outputFile: opts.outputFile,
    warnings: warnings.length > 0 ? warnings : undefined,
    meta: Object.keys(meta).length > 0 ? meta : undefined
  });

  // Optionally broadcast the just-built msg inline. The envelope above
  // is always emitted first (so `bb build … | bb deploy` and review
  // tooling are unaffected); a deploy flag additionally executes the
  // shared browser/burner path. Flags + executor live in
  // cli/utils/deploy-options.ts and are identical across every command.
  if (isDeployRequested(opts as any)) {
    await executeDeploy(outData, opts as any, {
      expectedAddress: opts.expectedAddress ?? opts.manager ?? opts.creator
    });
  }
}

// renderValidate and renderResolvedMetadata live in src/cli/utils/terminal.ts.

/**
 * Add a shared option only if the per-template command hasn't already
 * declared it. Avoids commander "duplicate flag" errors for templates
 * (vault, subscription, bounty, …) that already define their own --name
 * / --description / --image / --uri flags.
 */
function addOptionIfMissing(cmd: Command, flags: string, description: string): Command {
  const longFlag = flags.match(/--[a-z][a-z0-9-]*/)?.[0];
  if (longFlag && (cmd as any)._findOption?.(longFlag)) return cmd;
  return cmd.option(flags, description);
}

const sharedOpts = (cmd: Command) => {
  cmd
    .option('--condensed', 'Output compact JSON (no whitespace)')
    .option('--output-file <path>', 'Write output to file')
    .option('--json <input>', 'Pass all params as JSON (file, inline, or - for stdin). Overrides individual flags.')
    .option('--json-only', 'Skip the automatic review — emit pure JSON to stdout with no stderr commentary')
    .option('--explain', 'Print a human-readable explanation of the output to stderr (in addition to the auto-review)')
    .option('--creator <address>', 'Creator/sender address (bb1... or 0x...)')
    .option('--manager <address>', 'Collection manager address (bb1...)')
    .option('--simulate', 'After building, additionally call the BitBadges API simulate endpoint and render gas + net changes (requires BITBADGES_API_KEY). Distinct from `bb deploy --dry-run`, which simulates then exits without broadcasting.')
    .option('--events', 'When --simulate is set, dump the full raw chain events array (default: just the count)');
  // Network selection — only the --simulate path actually hits the
  // API, but we add the flags universally so `templates vault
  // --simulate --network local` works without parser surprises.
  addNetworkOptions(cmd);
  // Two-mode metadata flags — every metadata-bearing template accepts
  // EITHER `--uri <pre-hosted-uri>` (the on-chain `uri` field gets the
  // value, customData stays empty) OR the per-preset field flags
  // `--name <name>` + `--image <url>` + `--description <text>` (which
  // are serialized to JSON into the on-chain `customData` field, with
  // `uri` left empty). The builder throws MetadataMissingError if
  // neither mode is satisfied. Approval-only templates omit `--image`
  // (approvals are text-only).
  addOptionIfMissing(cmd, '--uri <url>', 'Mode 1: pre-hosted metadata URI (skips the per-field flags below)');
  addOptionIfMissing(cmd, '--name <name>', 'Mode 2: collection name (required with --image + --description if --uri not set)');
  addOptionIfMissing(cmd, '--description <text>', 'Mode 2: collection description (required with --name + --image if --uri not set)');
  addOptionIfMissing(cmd, '--image <url>', 'Mode 2: collection image URI (required with --name + --description if --uri not set)');
  // Standardized deploy flags (--browser / --burner / …) + their
  // "Deploy" help-group tags. Identical across every tx-emitting
  // command — see cli/utils/deploy-options.ts.
  addDeployOptions(cmd);

  // Tag the remaining shared flags with a help group so --help renders
  // them in categories under "Options:" (per-command flags stay
  // ungrouped at the top). Deploy flags are tagged by addDeployOptions.
  tagHelpGroups(cmd, {
    '--uri': 'Metadata',
    '--name': 'Metadata',
    '--description': 'Metadata',
    '--image': 'Metadata',
    '--condensed': 'Output',
    '--output-file': 'Output',
    '--json': 'Output',
    '--json-only': 'Output',
    '--explain': 'Output',
    '--network': 'Network',
    '--mainnet': 'Network',
    '--testnet': 'Network',
    '--local': 'Network',
    '--url': 'Network',
    '--creator': 'Builder',
    '--manager': 'Builder',
    '--simulate': 'Builder',
    '--events': 'Builder'
  });

  return cmd;
};

// ============================================================
// Collection builders
// ============================================================

sharedOpts(
  buildCommand
    .command('vault')
    .description('Create an IBC-backed vault token. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--backing-coin <symbol>', 'Backing coin symbol (USDC, BADGE, ATOM, OSMO)')
    .option('--symbol <symbol>', 'Display symbol (e.g. vUSDC)')
    .option('--daily-withdraw-limit <n>', 'Max daily withdrawal (display units)')
    .option('--require-2fa <collectionId>', '2FA collection ID for withdrawal gating')
    .option('--emergency-recovery <address>', 'Recovery address for emergency migration')
).action(async (opts) => {
  const { buildVault } = await import('../../core/builders/vault.js');
  if (opts.json) { emit(buildVault(readJsonInput(opts.json)), opts); return; }
  emit(buildVault({
    backingCoin: opts.backingCoin, uri: opts.uri, name: opts.name, symbol: opts.symbol, image: opts.image,
    description: opts.description, dailyWithdrawLimit: opts.dailyWithdrawLimit ? Number(opts.dailyWithdrawLimit) : undefined,
    require2fa: opts.require2fa, emergencyRecovery: opts.emergencyRecovery
  }), opts);
});

sharedOpts(
  buildCommand
    .command('agent-vault')
    .description(
      'Create an IBC-backed Agent Vault — a Smart Token whose withdrawal is gated for an agent ' +
        '(per-period cap / time window / multisig unlock). Set --manager to the human. ' +
        'Metadata: pass --uri OR --name + --image + --description.'
    )
    .requiredOption('--backing-coin <symbol>', 'Backing coin symbol (USDC, BADGE, ATOM, OSMO)')
    .option('--symbol <symbol>', 'Display symbol (e.g. avUSDC)')
    .option('--withdraw-limit <n>', 'Max withdrawal per --period (display units)')
    .option('--period <period>', 'Reset window for --withdraw-limit: daily | weekly | monthly (default daily)')
    .option('--unlock-at <ms>', 'Withdrawals invalid before this epoch-ms')
    .option('--expires-at <ms>', 'Withdrawals invalid after this epoch-ms')
    .option('--signers <list>', 'Comma-separated multisig signers (bb1addr or bb1addr:weight) whose votes unlock withdrawals')
    .option('--threshold <n>', 'Required yes-weight to unlock (N in N-of-M); defaults to unanimous')
    .option('--recovery <address>', 'Optional admin kill-switch: a bb1... recovery address that can claw back + fully exit the vault anytime, bypassing all gating')
).action(async (opts) => {
  const { buildAgentVault } = await import('../../core/builders/agent-vault.js');
  if (opts.json) { emit(buildAgentVault(readJsonInput(opts.json)), opts); return; }
  const signers = typeof opts.signers === 'string' && opts.signers.trim()
    ? opts.signers.split(',').map((s: string) => {
        const [address, weight] = s.trim().split(':');
        return { address: address.trim(), weight: weight ? Number(weight) : undefined };
      })
    : undefined;
  emit(buildAgentVault({
    backingCoin: opts.backingCoin, uri: opts.uri, name: opts.name, symbol: opts.symbol, image: opts.image,
    description: opts.description,
    withdrawLimit: opts.withdrawLimit ? Number(opts.withdrawLimit) : undefined,
    period: opts.period as ('daily' | 'weekly' | 'monthly' | undefined),
    unlockAt: opts.unlockAt ? Number(opts.unlockAt) : undefined,
    expiresAt: opts.expiresAt ? Number(opts.expiresAt) : undefined,
    signers,
    threshold: opts.threshold ? Number(opts.threshold) : undefined,
    recovery: opts.recovery
  }), opts);
});

sharedOpts(
  buildCommand
    .command('subscription')
    .description('Create a recurring subscription collection. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--interval <duration>', 'Interval: daily, monthly, annually, or shorthand (30d)')
    .option('--price <amount>', 'Price per interval (display units) — use with --denom/--recipient')
    .option('--denom <symbol|denom>', 'Payment coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .option('--recipient <address>', 'Payout address (bb1...)')
    .option('--payouts <json>', 'Multiple payouts JSON: [{"recipient","amount","denom"}]')
    .option('--tiers <n>', 'Number of tiers', '1')
    .option('--transferable', 'Allow post-mint P2P transfers')
).action(async (opts) => {
  const { buildSubscription } = await import('../../core/builders/subscription.js');
  if (opts.json) { emit(buildSubscription(readJsonInput(opts.json)), opts); return; }
  const params: any = {
    interval: opts.interval,
    tiers: Number(opts.tiers),
    transferable: !!opts.transferable,
    uri: opts.uri,
    name: opts.name,
    description: opts.description,
    image: opts.image
  };
  if (opts.payouts) {
    const payouts = JSON.parse(opts.payouts);
    if (Array.isArray(payouts)) {
      for (const p of payouts) {
        if (p && typeof p === 'object' && typeof p.denom === 'string') {
          p.denom = requireBbDenom(p.denom, '--payouts entry denom');
        }
        if (p && typeof p === 'object' && typeof p.recipient === 'string') {
          p.recipient = requireBb1AddressStrict(p.recipient, '--payouts entry recipient');
        }
      }
    }
    params.payouts = payouts;
  } else {
    params.price = Number(opts.price);
    params.denom = opts.denom ? requireBbDenom(opts.denom, '--denom') : opts.denom;
    params.recipient = opts.recipient ? requireBb1AddressStrict(opts.recipient, '--recipient') : opts.recipient;
  }
  emit(buildSubscription(params), opts);
});

sharedOpts(
  buildCommand
    .command('bounty')
    .description('Create a bounty escrow collection. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--amount <n>', 'Bounty amount (display units)')
    .requiredOption('--denom <symbol|denom>', 'Coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .requiredOption('--verifier <address>', 'Verifier address (bb1...)')
    .requiredOption('--recipient <address>', 'Recipient address (bb1...)')
    .requiredOption('--submitter <address>', 'Submitter address (bb1...) — receives the refund on deny / expire. Typically the bounty creator.')
    .option('--expiration <duration>', 'Expiration duration', '30d')
).action(async (opts) => {
  const { buildBounty } = await import('../../core/builders/bounty.js');
  if (opts.json) { emit(buildBounty(readJsonInput(opts.json)), opts); return; }
  const denom = requireBbDenom(opts.denom, '--denom');
  const verifier = requireBb1AddressStrict(opts.verifier, '--verifier');
  const recipient = requireBb1AddressStrict(opts.recipient, '--recipient');
  const submitter = requireBb1AddressStrict(opts.submitter, '--submitter');
  emit(buildBounty({
    amount: Number(opts.amount), denom, verifier, recipient,
    submitter,
    expiration: opts.expiration, uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('payment-request')
    .description('Create an agent-initiated payment request (no-escrow inverse of bounty). Metadata: pass --uri OR --name + --image + (--description OR --context).')
    .requiredOption('--amount <n>', 'Payment amount (display units)')
    .requiredOption('--denom <symbol|denom>', 'Coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .requiredOption('--payer <address>', 'Payer address (bb1...) — the human approver')
    .requiredOption('--recipient <address>', 'Recipient address (bb1...) — agent/merchant')
    .option('--expiration <duration>', 'Expiration duration', '30d')
    .option('--context <text>', 'Rationale shown to the payer at approval time (≥100 chars recommended). Used as the inline description if --description not set.')
).action(async (opts) => {
  const { buildPaymentRequest } = await import('../../core/builders/payment-request.js');
  if (opts.json) { emit(buildPaymentRequest(readJsonInput(opts.json)), opts); return; }
  const denom = requireBbDenom(opts.denom, '--denom');
  const payer = requireBb1AddressStrict(opts.payer, '--payer');
  const recipient = requireBb1AddressStrict(opts.recipient, '--recipient');
  emit(buildPaymentRequest({
    amount: Number(opts.amount),
    denom,
    payer,
    recipient,
    expiration: opts.expiration,
    uri: opts.uri,
    name: opts.name,
    image: opts.image,
    context: opts.context || opts.description
  }), opts);
});

sharedOpts(
  buildCommand
    .command('auction')
    .description('Create an auction collection. Metadata: pass --uri OR --name + --image + --description.')
    .option('--bid-deadline <duration>', 'Bidding window', '7d')
    .option('--accept-window <duration>', 'Accept window after bid deadline', '7d')
    .option('--seller <address>', 'Seller address — only this address can accept the winning bid (defaults to --creator)')
).action(async (opts) => {
  const { buildAuction } = await import('../../core/builders/auction.js');
  if (opts.json) { emit(buildAuction(readJsonInput(opts.json)), opts); return; }
  emit(buildAuction({
    bidDeadline: opts.bidDeadline, acceptWindow: opts.acceptWindow,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image,
    seller: opts.seller, creator: opts.creator
  }), opts);
});

sharedOpts(
  buildCommand
    .command('product-catalog')
    .description(
      'Create a product catalog collection. One token-id per product (1, 2, 3, ...). ' +
        'Each product becomes a "Purchase" approval that buyers consume to mint the SKU. ' +
        'Metadata: pass --uri OR --name + --image + --description (per-product image/description live inside the products JSON).'
    )
    .requiredOption(
      '--products <json>',
      'Product array JSON, one object per SKU. Fields:\n' +
        '  name (string, required)        — display name\n' +
        '  price (number, required)       — display units (e.g. 9.99 for $9.99 USDC)\n' +
        '  denom (string, required)       — payment coin symbol (USDC, BADGE, ...) or full denom\n' +
        '  maxSupply (number, optional)   — cap on units sold; omit/0 = unlimited\n' +
        '  burn (boolean, optional)       — true → burn-on-purchase (consumable); false/omit → buyer keeps the SKU (collectible)\n' +
        '  uri (string, optional)         — pre-hosted per-product metadata URI\n' +
        '  image, description (optional)  — inline metadata; used when uri is absent'
    )
    .requiredOption(
      '--store-address <address>',
      'Payment recipient (bb1.../0x — auto-normalized). Every purchase routes its `price * denom` here.'
    )
).action(async (opts) => {
  const { buildProductCatalog } = await import('../../core/builders/product-catalog.js');
  if (opts.json) { emit(buildProductCatalog(readJsonInput(opts.json)), opts); return; }
  const products = JSON.parse(opts.products);
  const storeAddress = requireBb1AddressStrict(opts.storeAddress, '--store-address');
  emit(buildProductCatalog({
    products, storeAddress,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('prediction-market')
    .description('Create a binary prediction market (YES/NO). Metadata: pass --uri OR --name + --image + --description.')
    .option('--verifier <address>', 'Market resolver address (bb1...)')
    .option('--resolver <address>', 'Alias for --verifier — matches the help-text label.')
    .option('--denom <symbol|denom>', 'Payment coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)', 'USDC')
).action(async (opts) => {
  const { buildPredictionMarket } = await import('../../core/builders/prediction-market.js');
  if (opts.json) { emit(buildPredictionMarket(readJsonInput(opts.json)), opts); return; }
  const verifierRaw = opts.verifier ?? opts.resolver;
  if (!verifierRaw) {
    process.stderr.write('Error: --verifier (or --resolver) is required.\n');
    process.exit(2);
  }
  const verifier = requireBb1AddressStrict(verifierRaw, opts.verifier ? '--verifier' : '--resolver');
  const denom = requireBbDenom(opts.denom, '--denom');
  emit(buildPredictionMarket({
    verifier, denom,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('smart-token')
    .description(
      'Create a Smart Token — an IBC-backed token that users deposit into (lock backing coin) and withdraw from (burn token, release backing coin). ' +
        'Vault collections are Smart Tokens with the cosmosCoinBackedPath invariant. ' +
        'Metadata: pass --uri OR --name + --image + --description.'
    )
    .requiredOption('--backing-coin <symbol>', 'Backing coin (USDC, BADGE, ATOM, OSMO)')
    .option('--symbol <symbol>', 'Display symbol (default: v<backing>)')
    .option('--tradable', 'Enable liquidity pool trading (adds "Liquidity Pools" standard tag)')
    .option('--ai-agent-vault', 'Add "AI Agent Vault" standard tag (display hint only)')
    .option('--allow-forceful-transfers', 'Allow forceful post-mint transfers (default: locked off — the safe default for vault-like Smart Tokens)')
).action(async (opts) => {
  const { buildSmartToken } = await import('../../core/builders/smart-token.js');
  if (opts.json) { emit(buildSmartToken(readJsonInput(opts.json)), opts); return; }
  emit(buildSmartToken({
    backingCoin: opts.backingCoin, symbol: opts.symbol, tradable: !!opts.tradable, aiAgentVault: !!opts.aiAgentVault,
    allowForcefulPostMintTransfers: !!opts.allowForcefulTransfers,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('credit-token')
    .description('Create a credit/prepaid token. Metadata: pass --uri OR --name + --image + --description.')
    .option('--payment-denom <symbol|denom>', 'Payment coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .option('--denom <symbol|denom>', 'Alias for --payment-denom — for consistency with the other builders.')
    .requiredOption('--recipient <address>', 'Payment recipient (bb1...)')
    .option('--symbol <symbol>', 'Token symbol', 'CREDIT')
    .option('--tokens-per-unit <n>', 'Tokens per 1 display unit of payment', '100')
).action(async (opts) => {
  const { buildCreditToken } = await import('../../core/builders/credit-token.js');
  if (opts.json) { emit(buildCreditToken(readJsonInput(opts.json)), opts); return; }
  const paymentDenomRaw = opts.paymentDenom ?? opts.denom;
  if (!paymentDenomRaw) {
    process.stderr.write('Error: --payment-denom (or --denom) is required.\n');
    process.exit(2);
  }
  const paymentDenom = requireBbDenom(paymentDenomRaw, opts.paymentDenom ? '--payment-denom' : '--denom');
  const recipient = requireBb1AddressStrict(opts.recipient, '--recipient');
  emit(buildCreditToken({
    paymentDenom, recipient, symbol: opts.symbol,
    tokensPerUnit: Number(opts.tokensPerUnit),
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('custom-2fa')
    .description('Create a custom 2FA token. Metadata: pass --uri OR --name + --image + --description.')
    .option('--burnable', 'Allow burning')
    .option('--transferable', 'Allow post-mint P2P transfers')
).action(async (opts) => {
  const { buildCustom2FA } = await import('../../core/builders/custom-2fa.js');
  if (opts.json) { emit(buildCustom2FA(readJsonInput(opts.json)), opts); return; }
  emit(buildCustom2FA({
    uri: opts.uri, name: opts.name, image: opts.image, description: opts.description,
    burnable: !!opts.burnable, transferable: !!opts.transferable, creator: opts.creator
  }), opts);
});

// NOTE: `bb build quests` was removed (ticket 0435). The builder emitted
// a merkleChallenge with an empty root, which the chain rejects
// (challenges.go:58 — "challenge is nil or has empty root"), so a quest
// built via the CLI was not claimable on-chain; the working quest claim
// path is the off-chain BitBadges claims system, which the CLI does not
// wire. The SDK `buildQuests` + isQuestApproval recognizers are retained
// for the FE/claims path; the CLI surface is removed pending a decision
// on the intended on-chain quest mechanic (0435).

sharedOpts(
  buildCommand
    .command('address-list')
    .description('Create an on-chain address list. Metadata: pass --uri OR --name + --image + --description.')
).action(async (opts) => {
  const { buildAddressList } = await import('../../core/builders/address-list.js');
  if (opts.json) { emit(buildAddressList(readJsonInput(opts.json)), opts); return; }
  emit(buildAddressList({
    uri: opts.uri, name: opts.name, image: opts.image, description: opts.description,
    manager: opts.manager, creator: opts.creator
  }), opts);
});

// ============================================================
// Approval builders (user-level)
// ============================================================

sharedOpts(
  buildCommand
    .command('intent')
    .description('Create an OTC swap intent (user outgoing approval)')
    .requiredOption('--address <address>', 'Creator address (bb1...)')
    .requiredOption('--collection-id <id>', 'Intent Exchange collection ID')
    .requiredOption('--pay-denom <symbol|denom>', 'What you send. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .requiredOption('--pay-amount <n>', 'Amount you send (display units)')
    .requiredOption('--receive-denom <symbol|denom>', 'What you receive. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .requiredOption('--receive-amount <n>', 'Amount you receive (display units)')
    .option('--expiration <when>', 'Intent expiry: ms-since-epoch (1748140800000) or duration (30d, 24h, monthly). Default 30d, matches `bb intents create`.', '30d')
).action(async (opts) => {
  const { buildIntent } = await import('../../core/builders/intent.js');
  if (opts.json) { emit(buildIntent(readJsonInput(opts.json)), opts); return; }
  const payDenom = requireBbDenom(opts.payDenom, '--pay-denom');
  const receiveDenom = requireBbDenom(opts.receiveDenom, '--receive-denom');
  const address = requireBb1AddressStrict(opts.address, '--address');
  emit(buildIntent({ address, collectionId: opts.collectionId, payDenom, payAmount: Number(opts.payAmount), receiveDenom, receiveAmount: Number(opts.receiveAmount), expiration: opts.expiration }), opts);
});

// `bb build recurring-payment` removed: it emitted a recurring approval
// shape `isUserRecurringApproval` rejects (so the poller never charged
// it). The correct subscriber-side recurring approval is created by
// `bb subscriptions claim <id>` / `bb subscriptions subscribe`, which
// read the real subscription approval and call `userRecurringApproval`.

sharedOpts(
  buildCommand
    .command('listing')
    .description('Create a marketplace listing (user outgoing approval)')
    .requiredOption('--address <address>', 'Seller address (bb1...)')
    .requiredOption('--collection-id <id>', 'Collection ID to list from')
    .requiredOption('--token-ids <range>', 'Token ID range (e.g. "1-5" or "1")')
    .requiredOption('--price <n>', 'Asking price (display units)')
    .requiredOption('--denom <symbol|denom>', 'Price coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .option('--max-sales <n>', 'Maximum number of sales', '1')
    .option('--expiration <when>', 'Listing expiry: ms-since-epoch (1748140800000) or duration (30d, 24h, monthly). Default 30d.', '30d')
).action(async (opts) => {
  const { buildListing } = await import('../../core/builders/listing.js');
  if (opts.json) { emit(buildListing(readJsonInput(opts.json)), opts); return; }
  const denom = requireBbDenom(opts.denom, '--denom');
  const address = requireBb1AddressStrict(opts.address, '--address');
  emit(buildListing({ address, collectionId: opts.collectionId, tokenIds: opts.tokenIds, price: Number(opts.price), denom, maxSales: Number(opts.maxSales), expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('bid')
    .description('Create a marketplace bid (user incoming approval)')
    .requiredOption('--address <address>', 'Bidder address (bb1...)')
    .requiredOption('--collection-id <id>', 'Collection ID to bid on')
    .option('--token-ids <id>', 'Single token ID to bid on (e.g. "1" or "1-1"). Omit for a collection-wide bid (parity with `bb nfts bid`).')
    .option('--token-amount <n>', 'Number of tokens (default 1)', '1')
    .requiredOption('--price <n>', 'Bid price (display units)')
    .requiredOption('--denom <symbol|denom>', 'Price coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .option('--expiration <when>', 'Bid expiry: ms-since-epoch (1748140800000) or duration (7d, 24h, monthly). Default 7d.', '7d')
).action(async (opts) => {
  const { buildBid } = await import('../../core/builders/bid.js');
  if (opts.json) { emit(buildBid(readJsonInput(opts.json)), opts); return; }
  const denom = requireBbDenom(opts.denom, '--denom');
  const address = requireBb1AddressStrict(opts.address, '--address');
  emit(buildBid({ address, collectionId: opts.collectionId, tokenIds: opts.tokenIds, tokenAmount: Number(opts.tokenAmount), price: Number(opts.price), denom, expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('pm-sell-intent')
    .description('Create a prediction market sell intent (user outgoing approval)')
    .requiredOption('--address <address>', 'Seller address (bb1...)')
    .requiredOption('--collection-id <id>', 'Prediction market collection ID')
    .requiredOption('--token <yes|no>', 'Which outcome token to sell')
    .requiredOption('--amount <n>', 'Number of tokens to sell')
    .requiredOption('--price <n>', 'Total payment amount (display units)')
    .requiredOption('--denom <symbol|denom>', 'Payment coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .option('--expiration <when>', 'Intent expiry: ms-since-epoch (1748140800000) or duration (24h, 7d, monthly). Default 24h, matches `bb prediction-markets buy/sell`.', '24h')
).action(async (opts) => {
  const { buildPmSellIntent } = await import('../../core/builders/pm-sell-intent.js');
  if (opts.json) { emit(buildPmSellIntent(readJsonInput(opts.json)), opts); return; }
  const denom = requireBbDenom(opts.denom, '--denom');
  const address = requireBb1AddressStrict(opts.address, '--address');
  emit(buildPmSellIntent({ address, collectionId: opts.collectionId, token: opts.token, amount: Number(opts.amount), price: Number(opts.price), denom, expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('pm-buy-intent')
    .description('Create a prediction market buy intent (user incoming approval)')
    .requiredOption('--address <address>', 'Buyer address (bb1...)')
    .requiredOption('--collection-id <id>', 'Prediction market collection ID')
    .requiredOption('--token <yes|no>', 'Which outcome token to buy')
    .requiredOption('--amount <n>', 'Number of tokens to buy')
    .requiredOption('--price <n>', 'Total payment amount (display units)')
    .requiredOption('--denom <symbol|denom>', 'Payment coin. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
    .option('--expiration <when>', 'Intent expiry: ms-since-epoch (1748140800000) or duration (24h, 7d, monthly). Default 24h, matches `bb prediction-markets buy/sell`.', '24h')
).action(async (opts) => {
  const { buildPmBuyIntent } = await import('../../core/builders/pm-buy-intent.js');
  if (opts.json) { emit(buildPmBuyIntent(readJsonInput(opts.json)), opts); return; }
  const denom = requireBbDenom(opts.denom, '--denom');
  const address = requireBb1AddressStrict(opts.address, '--address');
  emit(buildPmBuyIntent({ address, collectionId: opts.collectionId, token: opts.token, amount: Number(opts.amount), price: Number(opts.price), denom, expiration: opts.expiration }), opts);
});

// ============================================================
// Cosmos bank MsgSend (low-level coin transfer, not BitBadges tokens)
// ============================================================
//
// MsgSend is the stock cosmos-sdk bank send — it moves a coin denom
// (ubadge, ibc/...) between accounts and bypasses the BitBadges
// tokenization module entirely. Use this for fee top-ups, returning
// dust, paying a verifier off-chain-arranged invoice, etc. For moving
// a BitBadges tokenized token use `bb build transfer` instead, which
// emits MsgTransferTokens.

sharedOpts(
  buildCommand
    .command('send')
    .description(
      'Generate a standard cosmos.bank.v1beta1.MsgSend (bank send). For fee top-ups, returning dust, ' +
        'or any plain coin transfer that bypasses BitBadges tokenization. For BitBadges token transfers, use `bb build transfer`.'
    )
    .requiredOption('--from <address>', 'Sender address (bb1.../0x... auto-normalized)')
    .requiredOption('--to <address>', 'Recipient address (bb1.../0x... auto-normalized)')
    .requiredOption(
      '--amount <n>',
      'Amount to send. Interpreted as display units when --denom is a known symbol (USDC, BADGE, ATOM, OSMO); ' +
        'as base units when --denom is a raw chain denom (ubadge, ibc/...). Use --base-units to force base-unit interpretation either way.'
    )
    .requiredOption('--denom <symbol-or-denom>', 'Coin symbol (USDC, BADGE) or raw chain denom (ubadge, ibc/...)')
    .option('--base-units', 'Treat --amount as already-in-base-units, skipping the symbol→decimals conversion')
)
  .action(async (opts) => {
    try {
      const { requireBb1AddressStrict } = await import('../utils/address.js');
      const { resolveAmount } = await import('../utils/amount.js');
      const fromAddress = requireBb1AddressStrict(opts.from, '--from');
      const toAddress = requireBb1AddressStrict(opts.to, '--to');
      // Canonical amount/denom resolution — shared with auctions /
      // nfts / intents / prediction-markets (0410). This
      // replaces a re-rolled branch whose else-path display-converted
      // even canonical chain denoms, contradicting this command's own
      // "base units when --denom is a raw chain denom" help text;
      // resolveAmount is the help-text-correct, canonical behavior.
      const { denom, amount } = resolveAmount(
        String(opts.amount),
        opts.denom,
        !!opts.baseUnits,
        { amountFlag: '--amount', denomFlag: '--denom' }
      );
      const msg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress,
          toAddress,
          amount: [{ denom, amount }]
        }
      };
      // Route through the shared emit() like every sibling build
      // subcommand so --condensed/--output-file AND the deploy gate
      // (--browser/--burner/--simulate) actually work. MsgSend is
      // envelope-safe: not a collection / approval / transfer tx, so
      // emit() skips all the collection-specific backfill and falls
      // straight to output + the deploy gate.
      emit(msg, opts);
    } catch (err: any) {
      process.stderr.write(`Error: ${err?.message || err}\n`);
      process.exit(1);
    }
  });

// ============================================================
// Transfer walkthrough (interactive)
// ============================================================

sharedOpts(
  buildCommand
    .command('transfer')
    .description('Interactive walkthrough for MsgTransferTokens — fetches the collection + sender outgoing + recipient incoming approvals and walks you through picking prioritizedApprovals, only-check scopes, precalculation, and balances. Any flag can short-circuit the prompt for that step. Requires BITBADGES_API_KEY.')
    .option('--collection-id <id>', 'Collection ID')
    .option('--from <address>', 'Sender address (bb1.../0x...) — use "Mint" for minting')
    .option('--to <address>', 'Recipient address (bb1.../0x...)')
    .option('--amount <n>', 'Per-recipient amount (used when not precalculated)')
    .option('--token-ids <spec>', 'Token IDs (e.g. "1-5", "1,3,5", "all")')
    .option('-y, --yes', 'Non-interactive: skip all prompts. Picks no prioritized approvals, no precalc, default amount=1, default tokenIds=all valid. Use for scripts/CI.')
).action(async (opts) => {
  if (!process.env.BITBADGES_API_KEY) {
    // Fall through to runtime API-key resolution; the apiClient will
    // emit a clear error if neither env nor config has one.
  }
  const { runTransferWalkthrough } = await import('../utils/walkthrough-transfer.js');
  try {
    const msg = await runTransferWalkthrough({
      collectionId: opts.collectionId,
      from: opts.from,
      to: opts.to,
      amount: opts.amount,
      tokenIds: opts.tokenIds,
      yes: !!opts.yes
    });
    emit(msg, opts);
  } catch (err: any) {
    process.stderr.write(`\nTransfer walkthrough failed: ${err?.message || err}\n`);
    process.exit(1);
  }
});
