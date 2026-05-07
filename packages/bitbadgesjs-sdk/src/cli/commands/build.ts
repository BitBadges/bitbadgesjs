import { Command } from 'commander';
import { output, readJsonInput, addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { isQuiet } from '../utils/envelope.js';
import { renderReview, renderValidate, renderResolvedMetadata, renderSimulate } from '../utils/terminal.js';
import { isCollectionMsg, normalizeToCreateOrUpdate } from '../utils/normalizeMsg.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { runBurnerCreate, pickBurner, type BurnerNetwork } from '../utils/burner.js';

export const buildCommand = new Command('build').description('Deterministic transaction builders — flag-based generators for vaults, NFTs, subscriptions, bounties, and more. Output: ready-to-sign JSON. To broadcast, pipe into `bb cli deploy --burner`.');

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
    if (opts.creator) data.value.creator = opts.creator;
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
    //     — typical for deny/expire branches in bounty/crowdfund/etc. where
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

  // Emit the JSON payload FIRST. Scroll order on an interactive terminal
  // naturally puts the most recently-written bytes at the bottom, so the
  // review summary appearing *after* the JSON means the user's final
  // eyeline lands on the review verdict — the most actionable bit.
  //
  // Stdout flushes synchronously for pipes/files and line-buffered for
  // TTYs, so writing JSON before the stderr review keeps the visible
  // order stable across both cases.
  //
  // Narrow Universal → MsgCreateCollection / MsgUpdateCollection right at
  // the write boundary. Agents and humans see the proto's real per-intent
  // message type; only legacy internal tooling sees the Universal superset.
  const outData = isCollectionTx ? normalizeToCreateOrUpdate(data) : data;
  output(outData, { condensed: opts.condensed, outputFile: opts.outputFile });

  // --explain: run interpretTransaction and print human-readable summary.
  // Printed to stderr so it doesn't pollute the JSON pipe; shown above the
  // auto-review so the narrative ("what this tx does") precedes the
  // critique ("what might be wrong with it").
  if (opts.explain && isCollectionTx && !isQuiet()) {
    const { interpretTransaction } = await import('../../core/interpret-transaction.js');
    const explanation = interpretTransaction(data.value);
    process.stderr.write('\n── Explanation ──\n' + explanation + '\n');
  }

  // Auto-review every produced collection tx. Runs both the design-level
  // `reviewCollection()` checks (audit, standards, UX) and the low-level
  // structural `validateTransaction()` checks so templates can't silently
  // produce JSON that the chain would reject. Findings go to stderr so
  // stdout stays pure JSON for sign/broadcast pipelines; --json-only
  // suppresses both for callers that want zero stderr noise.
  //
  // Auto-validate runs for BOTH collection and user-approval templates
  // (both produce structurally validatable txs). Auto-review and
  // metadata + simulate are gated below — review only fires for
  // collection txs (collection-specific rules), and simulate is
  // refused for approval-style msgs entirely.
  // `--quiet` (and `BB_QUIET=1`) suppresses commentary streams just like
  // `--json-only`, but stays scoped to commentary — actual errors still
  // emit. Use the same gate so the four banners below follow one rule.
  const suppressCommentary = !!opts.jsonOnly || isQuiet();

  if (!suppressCommentary && (isCollectionTx || isUserApprovalTx || isTransferTx)) {
    // Static validation FIRST — if the JSON is structurally broken, the
    // design review below is much less meaningful.
    try {
      const { validateTransaction } = await import('../../core/validate.js');
      const wrapped = { messages: [data] };
      const vResult = validateTransaction(wrapped);
      process.stderr.write('\n' + renderValidate(vResult, { stream: process.stderr, title: 'Auto-Validate' }) + '\n');
    } catch (err) {
      process.stderr.write(`Validation skipped: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  if (!suppressCommentary && isCollectionTx) {
    try {
      const { reviewCollection } = await import('../../core/review.js');
      // reviewCollection wants either a raw collection or a tx body with
      // messages[]. Templates emit a single Msg, so wrap it.
      const result = reviewCollection({ messages: [data] });
      process.stderr.write('\n' + renderReview(result, { stream: process.stderr, title: 'Auto-Review' }) + '\n');
    } catch (err) {
      process.stderr.write(`Review skipped: ${err instanceof Error ? err.message : String(err)}\n`);
    }

    // Resolved Metadata — the final on-chain `(uri, customData)` pairs
    // for every metadata-bearing entity in this tx, after the two-mode
    // resolution. Helps the user verify they got the mode they expected
    // (URI mode keeps customData empty; inline mode keeps uri empty and
    // surfaces a parsed name/image preview from customData).
    try {
      process.stderr.write('\n' + renderResolvedMetadata(data, { stream: process.stderr }) + '\n');
    } catch (err) {
      process.stderr.write(`Resolved-metadata preview skipped: ${err instanceof Error ? err.message : String(err)}\n`);
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
  if (!suppressCommentary && opts.simulate && (isCollectionTx || isTransferTx)) {
    try {
      const { getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
      const apiKey = getApiKeyForNetwork(opts);
      if (!apiKey) {
        process.stderr.write(
          '\n' +
            renderSimulate(
              {
                success: false,
                error:
                  'Auto-Simulate skipped — no API key. Set BITBADGES_API_KEY or run `bitbadges-cli config set apiKey <key>`.'
              },
              { stream: process.stderr, title: 'Auto-Simulate' }
            ) +
            '\n'
        );
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
    } catch (err) {
      process.stderr.write(`Simulation skipped: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  // Approval-template auto-simulate skip — sits OUTSIDE the
  // collection-only block so it fires even when isCollectionTx is
  // false. Approval msgs already get the Auto-Validate run above; we
  // print the skip note once so the user understands why no gas is
  // shown.
  if (!opts.jsonOnly && opts.simulate && isUserApprovalTx) {
    process.stderr.write(
      '\nAuto-Simulate skipped — wrap user-level approvals inside an alternative approval message to simulate end-to-end. Auto-Validate ran above.\n'
    );
  }

  // ── --deploy-with-browser ───────────────────────────────────────────────
  // Composes build + browser-bridge broadcast in one step. Equivalent
  // to piping the JSON output to `bb cli deploy --browser --msg-stdin
  // --manager <addr>`. The connected wallet on /sign page signs and
  // broadcasts; account number / sequence / gas / fees are auto-handled
  // frontend-side by TxModal.
  if (opts.deployWithBrowser) {
    if (opts.deployWithBurner) {
      process.stderr.write(
        '\nError: --deploy-with-browser and --deploy-with-burner are mutually exclusive.\n'
      );
      process.exit(2);
    }
    const networkName = resolveNetwork(opts);
    const apiUrl = getApiUrl(opts);
    const apiKey = getApiKeyForNetwork(opts);
    const { bridgeSign, resolveFrontendUrl } = await import('../auth/browser-bridge.js');
    const frontendUrl = resolveFrontendUrl(networkName, opts.frontendUrl);
    const expectedAddress = opts.expectedAddress ?? opts.manager ?? opts.creator;
    const requestedTimeoutSec = opts.timeout ? Math.min(1800, Math.max(60, Number(opts.timeout))) : 300;
    process.stderr.write(`\nOpening browser to ${frontendUrl}/sign for wallet signature + broadcast...\n`);
    try {
      const result = await bridgeSign({
        mode: 'tx',
        payload: {
          chain: 'cosmos',
          txsInfo: [{ type: outData.typeUrl, msg: outData.value }],
          expectedAddress,
          signOnly: !!opts.signOnly,
        },
        baseUrl: apiUrl,
        frontendUrl,
        apiKey,
        timeoutMs: requestedTimeoutSec * 1000,
        noOpen: opts.open === false,
      });
      if (result.error) {
        process.stderr.write(`Browser broadcast cancelled or rejected: ${result.error}\n`);
        process.exit(1);
      }
      const payload: any = opts.signOnly
        ? {
            success: !!result.signedTx,
            path: 'browser',
            mode: 'sign-only',
            signedTx: result.signedTx ?? null,
            chain: result.chain ?? 'cosmos',
          }
        : {
            success: !!result.hash,
            path: 'browser',
            mode: 'sign-and-broadcast',
            txHash: result.hash ?? null,
            chain: result.chain ?? 'cosmos',
          };
      process.stdout.write('\n' + JSON.stringify(payload, null, 2) + '\n');
      if (!payload.success) process.exit(1);
      return;
    } catch (err: any) {
      process.stderr.write(`Browser broadcast failed: ${err?.message || err}\n`);
      process.exit(1);
    }
  }

  // ── --deploy-with-burner ────────────────────────────────────────────────
  // Composes the build + burner-deploy pipeline into one step.
  // Equivalent to piping the JSON output to `bb cli deploy --burner
  // --msg-stdin --manager <addr>`. CREATE-ONLY: the burner flow rejects
  // updates, transfers, approvals — runBurnerCreate throws a clear error
  // if the resolved msg isn't MsgCreateCollection (or
  // MsgUniversalUpdateCollection with collectionId=0).
  if (opts.deployWithBurner) {
    if (!opts.manager) {
      process.stderr.write(
        '\nError: --deploy-with-burner requires --manager <bb1...>. The burner is a throwaway signer; the manager address captures lasting collection ownership.\n'
      );
      process.exit(2);
    }

    const networkName = resolveNetwork(opts);
    const network: BurnerNetwork = networkName as NetworkMode;
    const apiUrl = getApiUrl(opts);
    const nodeUrl = (opts as any).nodeUrl || NETWORK_CONFIGS[network].nodeUrl;
    const apiKey = getApiKeyForNetwork(opts);

    if ((opts.fund ?? 'faucet') === 'faucet' && !apiKey && network !== 'local') {
      process.stderr.write(
        'Warning: --fund faucet requires an API key on non-local networks. Set BITBADGES_API_KEY or `bb cli config set apiKey <key>`.\n'
      );
    }

    const choice = await pickBurner({
      network,
      nodeUrl,
      forceNew: Boolean(opts.new),
      reuseSelector: opts.reuse
    });

    try {
      const result = await runBurnerCreate({
        msg: outData,
        network,
        apiUrl,
        nodeUrl,
        manager: opts.manager,
        fund: opts.fund === 'manual' ? 'manual' : 'faucet',
        apiKey,
        fee: { amount: String(opts.fee ?? '0'), denom: String(opts.feeDenom ?? 'ubadge') },
        gas: Number(opts.gas ?? 400000),
        reuseRecord: choice.kind === 'reuse' ? choice.record : undefined,
        nonInteractive: Boolean(opts.nonInteractive) || !process.stdout.isTTY,
        pollTimeoutMs: Number(opts.pollTimeout ?? 60) * 1000
      });

      const payload = {
        success: result.success,
        ephemeralAddress: result.ephemeralAddress,
        recoveryPath: result.recoveryPath,
        txHash: result.txHash,
        collectionId: result.collectionId ?? null,
        paused: result.paused,
        error: result.error
      };
      process.stdout.write('\n' + JSON.stringify(payload, null, 2) + '\n');
      if (!result.success && !result.paused) process.exit(1);
    } catch (err: any) {
      process.stderr.write(`Burner deploy failed: ${err?.message || err}\n`);
      process.exit(1);
    }
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
    .option('--simulate', 'Also simulate the tx against the BitBadges API and render gas + net changes (requires BITBADGES_API_KEY)')
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
  // --deploy-with-burner — collapses the build + burner-deploy
  // pipeline into a single command. CREATE-ONLY: rejects updates,
  // transfers, approvals (the burner is a one-shot signer; ownership
  // lives on --manager). Equivalent to:
  //   bb cli build <preset> ... | bb cli deploy --burner --msg-stdin --manager <addr>
  cmd.option('--deploy-with-burner', 'After building, broadcast via the throwaway burner flow (CREATE-ONLY). Requires --manager.');
  cmd.option('--deploy-with-browser', 'After building, hand off to the BitBadges /sign page for wallet signature + broadcast. Pairs with your connected wallet (Keplr, MetaMask, etc.).');
  cmd.option('--sign-only', 'With --deploy-with-browser: have the wallet sign but not broadcast — returns the signed tx bytes for caller-controlled broadcast.');
  cmd.option('--frontend-url <url>', 'With --deploy-with-browser: override the frontend base URL.');
  cmd.option('--no-open', 'With --deploy-with-browser: print the sign URL instead of auto-launching the browser.');
  cmd.option('--timeout <seconds>', 'With --deploy-with-browser: how long to wait for the wallet to confirm (default 300, max 1800).');
  cmd.option('--expected-address <addr>', 'With --deploy-with-browser: bb1.../0x... that the connected wallet must match. Defaults to --manager / --creator.');
  cmd.option('--fund <mode>', 'With --deploy-with-burner: funding source for the burner (faucet | manual)', 'faucet');
  cmd.option('--fee <amount>', 'When deploying: fee amount in base units', '0');
  cmd.option('--fee-denom <denom>', 'When deploying: fee denom', 'ubadge');
  cmd.option('--gas <number>', 'When deploying: gas limit', '400000');
  cmd.option('--new', 'With --deploy-with-burner: skip the burner picker and always create a fresh wallet');
  cmd.option('--reuse <selector>', 'With --deploy-with-burner: reuse a specific saved burner by address or recovery file path');
  cmd.option('--non-interactive', 'With --deploy-with-burner: never prompt; on any prompt point save state and exit for later resume');
  cmd.option('--poll-timeout <seconds>', 'With --deploy-with-burner: seconds to wait for funding to land before prompting/exiting', '60');
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
    .command('subscription')
    .description('Create a recurring subscription collection. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--interval <duration>', 'Interval: daily, monthly, annually, or shorthand (30d)')
    .option('--price <amount>', 'Price per interval (display units) — use with --denom/--recipient')
    .option('--denom <symbol>', 'Payment coin (USDC, BADGE)')
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
    params.payouts = JSON.parse(opts.payouts);
  } else {
    params.price = Number(opts.price);
    params.denom = opts.denom;
    params.recipient = opts.recipient;
  }
  emit(buildSubscription(params), opts);
});

sharedOpts(
  buildCommand
    .command('bounty')
    .description('Create a bounty escrow collection. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--amount <n>', 'Bounty amount (display units)')
    .requiredOption('--denom <symbol>', 'Coin (USDC, BADGE)')
    .requiredOption('--verifier <address>', 'Verifier address (bb1...)')
    .requiredOption('--recipient <address>', 'Recipient address (bb1...)')
    .option('--expiration <duration>', 'Expiration duration', '30d')
).action(async (opts) => {
  const { buildBounty } = await import('../../core/builders/bounty.js');
  if (opts.json) { emit(buildBounty(readJsonInput(opts.json)), opts); return; }
  emit(buildBounty({
    amount: Number(opts.amount), denom: opts.denom, verifier: opts.verifier, recipient: opts.recipient,
    expiration: opts.expiration, uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('payment-request')
    .description('Create an agent-initiated payment request (no-escrow inverse of bounty). Metadata: pass --uri OR --name + --image + (--description OR --context).')
    .requiredOption('--amount <n>', 'Payment amount (display units)')
    .requiredOption('--denom <symbol>', 'Coin (USDC, BADGE)')
    .requiredOption('--payer <address>', 'Payer address (bb1...) — the human approver')
    .requiredOption('--recipient <address>', 'Recipient address (bb1...) — agent/merchant')
    .option('--expiration <duration>', 'Expiration duration', '30d')
    .option('--context <text>', 'Rationale shown to the payer at approval time (≥100 chars recommended). Used as the inline description if --description not set.')
).action(async (opts) => {
  const { buildPaymentRequest } = await import('../../core/builders/payment-request.js');
  if (opts.json) { emit(buildPaymentRequest(readJsonInput(opts.json)), opts); return; }
  emit(buildPaymentRequest({
    amount: Number(opts.amount),
    denom: opts.denom,
    payer: opts.payer,
    recipient: opts.recipient,
    expiration: opts.expiration,
    uri: opts.uri,
    name: opts.name,
    image: opts.image,
    context: opts.context || opts.description
  }), opts);
});

sharedOpts(
  buildCommand
    .command('crowdfund')
    .description('Create a crowdfunding collection. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--goal <n>', 'Funding goal (display units)')
    .requiredOption('--denom <symbol>', 'Coin (USDC, BADGE)')
    .option('--crowdfunder <address>', 'Who receives funds on success (bb1...)')
    .option('--deadline <duration>', 'Deadline duration', '30d')
).action(async (opts) => {
  const { buildCrowdfund } = await import('../../core/builders/crowdfund.js');
  if (opts.json) { emit(buildCrowdfund(readJsonInput(opts.json)), opts); return; }
  emit(buildCrowdfund({
    goal: Number(opts.goal), denom: opts.denom, crowdfunder: opts.crowdfunder, deadline: opts.deadline,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image, creator: opts.creator
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
    .description('Create a product catalog collection. Metadata: pass --uri OR --name + --image + --description (per-product image/description live inside the products JSON).')
    .requiredOption('--products <json>', 'Product array JSON: [{"name","price","denom","maxSupply?","burn?","uri?","image?","description?"}]')
    .requiredOption('--store-address <address>', 'Payment recipient (bb1...)')
).action(async (opts) => {
  const { buildProductCatalog } = await import('../../core/builders/product-catalog.js');
  if (opts.json) { emit(buildProductCatalog(readJsonInput(opts.json)), opts); return; }
  const products = JSON.parse(opts.products);
  emit(buildProductCatalog({
    products, storeAddress: opts.storeAddress,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('prediction-market')
    .description('Create a binary prediction market (YES/NO). Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--verifier <address>', 'Market resolver address (bb1...)')
    .option('--denom <symbol>', 'Payment coin', 'USDC')
).action(async (opts) => {
  const { buildPredictionMarket } = await import('../../core/builders/prediction-market.js');
  if (opts.json) { emit(buildPredictionMarket(readJsonInput(opts.json)), opts); return; }
  emit(buildPredictionMarket({
    verifier: opts.verifier, denom: opts.denom,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('smart-account')
    .description('Create an IBC-backed smart account. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--backing-coin <symbol>', 'Backing coin (USDC, BADGE, ATOM, OSMO)')
    .option('--symbol <symbol>', 'Display symbol')
    .option('--tradable', 'Enable liquidity pool trading')
    .option('--ai-agent-vault', 'Add AI Agent Vault standard tag')
).action(async (opts) => {
  const { buildSmartAccount } = await import('../../core/builders/smart-account.js');
  if (opts.json) { emit(buildSmartAccount(readJsonInput(opts.json)), opts); return; }
  emit(buildSmartAccount({
    backingCoin: opts.backingCoin, symbol: opts.symbol, tradable: !!opts.tradable, aiAgentVault: !!opts.aiAgentVault,
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

sharedOpts(
  buildCommand
    .command('credit-token')
    .description('Create a credit/prepaid token. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--payment-denom <symbol>', 'Payment coin (USDC, BADGE)')
    .requiredOption('--recipient <address>', 'Payment recipient (bb1...)')
    .option('--symbol <symbol>', 'Token symbol', 'CREDIT')
    .option('--tokens-per-unit <n>', 'Tokens per 1 display unit of payment', '100')
).action(async (opts) => {
  const { buildCreditToken } = await import('../../core/builders/credit-token.js');
  if (opts.json) { emit(buildCreditToken(readJsonInput(opts.json)), opts); return; }
  emit(buildCreditToken({
    paymentDenom: opts.paymentDenom, recipient: opts.recipient, symbol: opts.symbol,
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
    burnable: !!opts.burnable, transferable: !!opts.transferable
  }), opts);
});

sharedOpts(
  buildCommand
    .command('quests')
    .description('Create a quest/reward collection. Metadata: pass --uri OR --name + --image + --description.')
    .requiredOption('--reward <n>', 'Reward per claim (display units)')
    .requiredOption('--denom <symbol>', 'Reward coin (USDC, BADGE)')
    .requiredOption('--max-claims <n>', 'Maximum number of claims')
).action(async (opts) => {
  const { buildQuests } = await import('../../core/builders/quests.js');
  if (opts.json) { emit(buildQuests(readJsonInput(opts.json)), opts); return; }
  emit(buildQuests({
    reward: Number(opts.reward), denom: opts.denom, maxClaims: Number(opts.maxClaims),
    uri: opts.uri, name: opts.name, description: opts.description, image: opts.image
  }), opts);
});

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
    .requiredOption('--pay-denom <symbol>', 'What you send (USDC, BADGE)')
    .requiredOption('--pay-amount <n>', 'Amount you send (display units)')
    .requiredOption('--receive-denom <symbol>', 'What you receive (USDC, BADGE)')
    .requiredOption('--receive-amount <n>', 'Amount you receive (display units)')
    .option('--expiration <duration>', 'How long intent stays open', '7d')
).action(async (opts) => {
  const { buildIntent } = await import('../../core/builders/intent.js');
  if (opts.json) { emit(buildIntent(readJsonInput(opts.json)), opts); return; }
  emit(buildIntent({ address: opts.address, collectionId: opts.collectionId, payDenom: opts.payDenom, payAmount: Number(opts.payAmount), receiveDenom: opts.receiveDenom, receiveAmount: Number(opts.receiveAmount), expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('recurring-payment')
    .description('Create a recurring payment approval (user incoming)')
    .requiredOption('--collection-id <id>', 'Subscription collection ID')
    .requiredOption('--amount <n>', 'Payment amount per interval (display units)')
    .requiredOption('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .requiredOption('--interval <duration>', 'Payment interval (daily, monthly, annually)')
    .requiredOption('--recipient <address>', 'Who receives payments (bb1...)')
    .option('--expiration <duration>', 'How long subscription lasts', '365d')
).action(async (opts) => {
  const { buildRecurringPayment } = await import('../../core/builders/recurring-payment.js');
  if (opts.json) { emit(buildRecurringPayment(readJsonInput(opts.json)), opts); return; }
  emit(buildRecurringPayment({ collectionId: opts.collectionId, amount: Number(opts.amount), denom: opts.denom, interval: opts.interval, recipient: opts.recipient, expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('listing')
    .description('Create a marketplace listing (user outgoing approval)')
    .requiredOption('--address <address>', 'Seller address (bb1...)')
    .requiredOption('--collection-id <id>', 'Collection ID to list from')
    .requiredOption('--token-ids <range>', 'Token ID range (e.g. "1-5" or "1")')
    .requiredOption('--price <n>', 'Asking price (display units)')
    .requiredOption('--denom <symbol>', 'Price coin (USDC, BADGE)')
    .option('--max-sales <n>', 'Maximum number of sales', '1')
    .option('--expiration <duration>', 'Listing duration', '30d')
).action(async (opts) => {
  const { buildListing } = await import('../../core/builders/listing.js');
  if (opts.json) { emit(buildListing(readJsonInput(opts.json)), opts); return; }
  emit(buildListing({ address: opts.address, collectionId: opts.collectionId, tokenIds: opts.tokenIds, price: Number(opts.price), denom: opts.denom, maxSales: Number(opts.maxSales), expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('bid')
    .description('Create a marketplace bid (user incoming approval)')
    .requiredOption('--address <address>', 'Bidder address (bb1...)')
    .requiredOption('--collection-id <id>', 'Collection ID to bid on')
    .requiredOption('--token-ids <range>', 'Token ID range (e.g. "1-5" or "1")')
    .requiredOption('--price <n>', 'Bid price (display units)')
    .requiredOption('--denom <symbol>', 'Price coin (USDC, BADGE)')
    .option('--expiration <duration>', 'Bid duration', '7d')
).action(async (opts) => {
  const { buildBid } = await import('../../core/builders/bid.js');
  if (opts.json) { emit(buildBid(readJsonInput(opts.json)), opts); return; }
  emit(buildBid({ address: opts.address, collectionId: opts.collectionId, tokenIds: opts.tokenIds, price: Number(opts.price), denom: opts.denom, expiration: opts.expiration }), opts);
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
    .requiredOption('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .option('--expiration <duration>', 'How long intent stays open', '7d')
).action(async (opts) => {
  const { buildPmSellIntent } = await import('../../core/builders/pm-sell-intent.js');
  if (opts.json) { emit(buildPmSellIntent(readJsonInput(opts.json)), opts); return; }
  emit(buildPmSellIntent({ address: opts.address, collectionId: opts.collectionId, token: opts.token, amount: Number(opts.amount), price: Number(opts.price), denom: opts.denom, expiration: opts.expiration }), opts);
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
    .requiredOption('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .option('--expiration <duration>', 'How long intent stays open', '7d')
).action(async (opts) => {
  const { buildPmBuyIntent } = await import('../../core/builders/pm-buy-intent.js');
  if (opts.json) { emit(buildPmBuyIntent(readJsonInput(opts.json)), opts); return; }
  emit(buildPmBuyIntent({ address: opts.address, collectionId: opts.collectionId, token: opts.token, amount: Number(opts.amount), price: Number(opts.price), denom: opts.denom, expiration: opts.expiration }), opts);
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
    .option('--yes', 'Non-interactive: skip all prompts. Picks no prioritized approvals, no precalc, default amount=1, default tokenIds=all valid. Use for scripts/CI.')
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
