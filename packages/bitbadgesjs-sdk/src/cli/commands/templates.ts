import { Command } from 'commander';
import { output, readJsonInput } from '../utils/io.js';
import { renderReview, makeColor, rule } from '../utils/terminal.js';

export const templatesCommand = new Command('templates').description('Deterministic transaction templates — flag-based generators for vaults, NFTs, subscriptions, bounties, and more.');

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
  }
) {
  // Apply --creator / --manager overrides to collection msgs
  if (data.typeUrl?.includes('MsgUniversalUpdateCollection') && data.value) {
    if (opts.creator) data.value.creator = opts.creator;
    if (opts.manager) data.value.manager = opts.manager;
  }

  const isCollectionTx = data.typeUrl?.includes('MsgUniversalUpdateCollection');

  // Pre-fill the metadataPlaceholders sidecar from the user's --name /
  // --description / --image flags. Walk every placeholder URI in the tx
  // and supply the user's content for any URI the template didn't already
  // populate. Approval URIs derive a name from the approvalId so the
  // user's "My Vault" doesn't accidentally label every approval as
  // "My Vault" — they keep their own descriptive default.
  if (isCollectionTx && (opts.name || opts.description || opts.image)) {
    const meta = (data._meta = data._meta || {});
    const sidecar: Record<string, { name: string; description: string; image: string }> = (meta.metadataPlaceholders =
      meta.metadataPlaceholders || {});
    const fallbackName = opts.name || 'Untitled';
    const fallbackDescription = opts.description || '';
    const fallbackImage = opts.image || 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';
    const found = collectMetadataPlaceholders(data);
    for (const p of found) {
      if (sidecar[p.uri]) continue; // already filled by the template
      // Approval / alias / wrapper / denom-unit URIs should keep a
      // descriptive default rooted in their own identifier rather than
      // the user's collection name.
      if (p.uri.startsWith('ipfs://METADATA_APPROVAL_')) {
        const approvalId = p.uri.replace('ipfs://METADATA_APPROVAL_', '');
        sidecar[p.uri] = {
          name: approvalId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: '',
          image: '' // approval images MUST be empty per the standards
        };
        continue;
      }
      if (p.uri.startsWith('ipfs://METADATA_ALIAS_') || p.uri.startsWith('ipfs://METADATA_WRAPPER_')) {
        sidecar[p.uri] = {
          name: `${fallbackName} ${p.uri.startsWith('ipfs://METADATA_ALIAS_') ? 'alias path' : 'wrapper path'}`,
          description: fallbackDescription,
          image: fallbackImage
        };
        continue;
      }
      // Collection / token / anything else gets the user's flag values.
      sidecar[p.uri] = {
        name: fallbackName,
        description: fallbackDescription,
        image: fallbackImage
      };
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
  const { _meta, ...cleanData } = data;
  output(cleanData, { condensed: opts.condensed, outputFile: opts.outputFile });

  // --explain: run interpretTransaction and print human-readable summary.
  // Printed to stderr so it doesn't pollute the JSON pipe; shown above the
  // auto-review so the narrative ("what this tx does") precedes the
  // critique ("what might be wrong with it").
  if (opts.explain && isCollectionTx) {
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
  // We pass `selectedSkills: []` so the reviewer's skill-protocol matchers
  // don't run the "union of every skill" fan-out that defaults when the
  // context is unset. Templates know what they're building; the user can
  // still run `bitbadges-cli builder review <file>` for a full pass over
  // skills/standards they haven't declared on the collection yet.
  if (!opts.jsonOnly && isCollectionTx) {
    // Static validation FIRST — if the JSON is structurally broken, the
    // design review below is much less meaningful.
    try {
      const { validateTransaction } = await import('../../core/validate.js');
      const wrapped = { messages: [data] };
      const vResult = validateTransaction(wrapped);
      process.stderr.write('\n' + renderValidate(vResult) + '\n');
    } catch (err) {
      process.stderr.write(`Validation skipped: ${err instanceof Error ? err.message : String(err)}\n`);
    }

    try {
      const { reviewCollection } = await import('../../core/review.js');
      // reviewCollection wants either a raw collection or a tx body with
      // messages[]. Templates emit a single Msg, so wrap it.
      const result = reviewCollection({ messages: [data] }, { selectedSkills: [] });
      process.stderr.write('\n' + renderReview(result, { stream: process.stderr, title: 'Auto-Review' }) + '\n');
    } catch (err) {
      process.stderr.write(`Review skipped: ${err instanceof Error ? err.message : String(err)}\n`);
    }

    // Metadata To Upload — every placeholder URI on the tx that the
    // metadata auto-apply flow will later substitute. The user (or a
    // downstream tool) needs to produce JSON for each of these URIs and
    // upload it somewhere the chain can resolve before broadcast.
    try {
      const placeholders = collectMetadataPlaceholders(data);
      if (placeholders.length > 0) {
        process.stderr.write('\n' + renderMetadataPlaceholders(placeholders, data._meta?.metadataPlaceholders) + '\n');
      }
    } catch (err) {
      process.stderr.write(`Metadata placeholder scan skipped: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

/**
 * Walk a template's emitted transaction body and collect every placeholder
 * metadata URI (`ipfs://METADATA_*`) along with a description of what it
 * is and which fields the off-chain JSON should supply. The output powers
 * the "Metadata To Upload" section the auto-review prints to stderr.
 *
 * Non-placeholder URIs (real IPFS CIDs, https://... links) are skipped —
 * those are assumed to already resolve.
 */
interface MetadataPlaceholder {
  uri: string;
  kind: string;
  location: string;
  fields: string[];
}

function collectMetadataPlaceholders(data: any): MetadataPlaceholder[] {
  const out: MetadataPlaceholder[] = [];
  const seen = new Set<string>();
  const value = data?.value || {};

  const isPlaceholder = (uri: unknown): uri is string =>
    typeof uri === 'string' && /^ipfs:\/\/METADATA_[A-Z]/.test(uri);

  const push = (uri: string, kind: string, location: string, fields: string[]) => {
    if (seen.has(uri)) return;
    seen.add(uri);
    out.push({ uri, kind, location, fields });
  };

  // Collection metadata
  if (isPlaceholder(value?.collectionMetadata?.uri)) {
    push(
      value.collectionMetadata.uri,
      'Collection',
      'collectionMetadata.uri',
      ['name', 'description', 'image']
    );
  }

  // Per-token metadata
  if (Array.isArray(value.tokenMetadata)) {
    for (let i = 0; i < value.tokenMetadata.length; i++) {
      const tm = value.tokenMetadata[i];
      if (isPlaceholder(tm?.uri)) {
        const ids = Array.isArray(tm.tokenIds) && tm.tokenIds.length > 0
          ? tm.tokenIds.map((r: any) => `${r.start}-${r.end}`).join(', ')
          : 'all';
        push(
          tm.uri,
          `Token (ids: ${ids})`,
          `tokenMetadata[${i}].uri`,
          ['name', 'description', 'image']
        );
      }
    }
  }

  // Approval metadata
  if (Array.isArray(value.collectionApprovals)) {
    for (let i = 0; i < value.collectionApprovals.length; i++) {
      const a = value.collectionApprovals[i];
      if (isPlaceholder(a?.uri)) {
        push(
          a.uri,
          `Approval "${a.approvalId || i}"`,
          `collectionApprovals[${i}].uri`,
          ['name', 'description', 'image (must be "")']
        );
      }
    }
  }

  // Alias path metadata (path level + each denomUnit)
  if (Array.isArray(value.aliasPathsToAdd)) {
    for (let i = 0; i < value.aliasPathsToAdd.length; i++) {
      const ap = value.aliasPathsToAdd[i];
      if (isPlaceholder(ap?.metadata?.uri)) {
        push(
          ap.metadata.uri,
          `Alias path "${ap.denom || i}"`,
          `aliasPathsToAdd[${i}].metadata.uri`,
          ['name', 'description', 'image']
        );
      }
      if (Array.isArray(ap?.denomUnits)) {
        for (let j = 0; j < ap.denomUnits.length; j++) {
          const du = ap.denomUnits[j];
          if (isPlaceholder(du?.metadata?.uri)) {
            push(
              du.metadata.uri,
              `Denom unit "${du.symbol || j}" of ${ap.denom || i}`,
              `aliasPathsToAdd[${i}].denomUnits[${j}].metadata.uri`,
              ['name', 'description', 'image']
            );
          }
        }
      }
    }
  }

  // Cosmos wrapper path metadata
  if (Array.isArray(value.cosmosCoinWrapperPathsToAdd)) {
    for (let i = 0; i < value.cosmosCoinWrapperPathsToAdd.length; i++) {
      const wp = value.cosmosCoinWrapperPathsToAdd[i];
      if (isPlaceholder(wp?.metadata?.uri)) {
        push(
          wp.metadata.uri,
          `Wrapper path "${wp.denom || i}"`,
          `cosmosCoinWrapperPathsToAdd[${i}].metadata.uri`,
          ['name', 'description', 'image']
        );
      }
      if (Array.isArray(wp?.denomUnits)) {
        for (let j = 0; j < wp.denomUnits.length; j++) {
          const du = wp.denomUnits[j];
          if (isPlaceholder(du?.metadata?.uri)) {
            push(
              du.metadata.uri,
              `Wrapper denom unit "${du.symbol || j}" of ${wp.denom || i}`,
              `cosmosCoinWrapperPathsToAdd[${i}].denomUnits[${j}].metadata.uri`,
              ['name', 'description', 'image']
            );
          }
        }
      }
    }
  }

  return out;
}

/**
 * Format the Metadata To Upload section — colorized on TTY, plain elsewhere.
 * Accepts an optional sidecar `filled` map (usually from `data._meta.metadataPlaceholders`)
 * so entries the template already filled in can be marked as "provided".
 */
function renderMetadataPlaceholders(
  placeholders: MetadataPlaceholder[],
  filled?: Record<string, { name?: string; description?: string; image?: string }>
): string {
  const { c } = makeColor(process.stderr);
  const width = Math.min(80, (process.stderr as any).columns || 80);

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, 'Metadata To Upload')));
  lines.push('');

  const totalMissing = placeholders.filter((p) => !filled || !filled[p.uri]).length;
  const totalProvided = placeholders.length - totalMissing;

  for (const p of placeholders) {
    const supplied = filled?.[p.uri];
    const badge = supplied
      ? `${c('green', '✓')} ${c('bold', c('green', 'PROVIDED '))}`
      : `${c('yellow', '●')} ${c('bold', c('yellow', 'NEEDED   '))}`;
    lines.push(`  ${badge}  ${c('dim', p.uri)}`);
    lines.push(`      ${c('bold', p.kind)} — referenced by ${c('dim', p.location)}`);
    if (supplied) {
      const supplyBits: string[] = [];
      if (supplied.name) supplyBits.push(`name: "${supplied.name}"`);
      if (supplied.description) supplyBits.push(`description: "${supplied.description.slice(0, 40)}${supplied.description.length > 40 ? '…' : ''}"`);
      if (supplied.image) supplyBits.push(`image: ${supplied.image.slice(0, 50)}${supplied.image.length > 50 ? '…' : ''}`);
      if (supplyBits.length) lines.push(`      ${c('gray', '→')} ${supplyBits.join('  ')}`);
    } else {
      lines.push(`      ${c('gray', '→')} fields: ${p.fields.join(', ')}`);
    }
    lines.push('');
  }

  lines.push(c('gray', rule('━', width)));
  const summaryParts = [
    totalMissing > 0 ? c('yellow', `${totalMissing} needed`) : c('gray', `${totalMissing} needed`),
    totalProvided > 0 ? c('green', `${totalProvided} provided`) : c('gray', `${totalProvided} provided`)
  ];
  lines.push(`  ${c('bold', 'Summary')}  ${summaryParts.join('  ·  ')}`);
  lines.push(
    c(
      'dim',
      '  Upload each Needed entry as off-chain JSON (name, description, image) and\n' +
        '  substitute the placeholder URI with the real upload URI before broadcast.'
    )
  );
  lines.push(c('gray', rule('━', width)));
  return lines.join('\n');
}

/**
 * Compact validation renderer for the auto-review path. Prints a single
 * status line when clean, a short rule + findings block when not. Mirrors
 * the shape of `builder validate` but scoped to auto-review stderr.
 */
function renderValidate(result: { valid: boolean; issues: Array<{ severity: string; path?: string; message: string }> }): string {
  const { c } = makeColor(process.stderr);
  const width = Math.min(80, (process.stderr as any).columns || 80);
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  const lines: string[] = [];
  lines.push(c('gray', rule('━', width, 'Auto-Validate')));

  if (result.issues.length === 0) {
    lines.push('');
    lines.push(`  ${c('green', '✓')} ${c('bold', 'Clean')} — no structural issues`);
  } else {
    lines.push('');
    for (const issue of result.issues) {
      const lc = issue.severity === 'error' ? 'red' : 'yellow';
      const badge = issue.severity === 'error' ? '■ ERROR  ' : '▲ WARNING';
      lines.push(`  ${c(lc, c('bold', badge))}  ${c('dim', issue.path || '(root)')}`);
      for (const t of wrapLines(issue.message, width - 6)) {
        lines.push(`      ${t}`);
      }
    }
    lines.push('');
    lines.push(
      `  ${c('bold', 'Summary')}  ${errors.length > 0 ? c('red', `${errors.length} error`) : c('gray', '0 error')}  ·  ${
        warnings.length > 0 ? c('yellow', `${warnings.length} warning`) : c('gray', '0 warning')
      }`
    );
  }
  lines.push(c('gray', rule('━', width)));
  return lines.join('\n');
}

function wrapLines(text: string, width: number): string[] {
  if (width <= 10) return [text];
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    if (!line.length) { line = w; continue; }
    if (line.length + 1 + w.length > width) { out.push(line); line = w; }
    else line += ' ' + w;
  }
  if (line.length) out.push(line);
  return out;
}

/**
 * Add a shared option only if the per-template command hasn't already
 * declared it. Avoids commander "duplicate flag" errors for templates
 * (vault, subscription, bounty, …) that already define their own --name
 * / --description / --image flags. Those template-level flags double as
 * the metadataPlaceholders content because emit() reads opts.name etc.
 * directly — no extra plumbing needed.
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
    .option('--manager <address>', 'Collection manager address (bb1...)');
  // Metadata flags — only added when the template doesn't already declare
  // them. Templates that DO declare them keep their own description string;
  // emit() reads opts.name / description / image regardless.
  addOptionIfMissing(cmd, '--name <name>', 'Display name written into unfilled metadataPlaceholders entries (collection / tokens / alias paths)');
  addOptionIfMissing(cmd, '--description <text>', 'Description written into unfilled metadataPlaceholders entries');
  addOptionIfMissing(cmd, '--image <url>', 'Image URL written into unfilled metadataPlaceholders entries');
  return cmd;
};

// ============================================================
// Collection builders
// ============================================================

sharedOpts(
  templatesCommand
    .command('vault')
    .description('Create an IBC-backed vault token')
    .requiredOption('--backing-coin <symbol>', 'Backing coin symbol (USDC, BADGE, ATOM, OSMO)')
    .option('--name <name>', 'Collection name', 'Vault')
    .option('--symbol <symbol>', 'Display symbol (e.g. vUSDC)')
    .option('--image <url>', 'Image URL')
    .option('--description <text>', 'Description')
    .option('--daily-withdraw-limit <n>', 'Max daily withdrawal (display units)')
    .option('--require-2fa <collectionId>', '2FA collection ID for withdrawal gating')
    .option('--emergency-recovery <address>', 'Recovery address for emergency migration')
).action(async (opts) => {
  const { buildVault } = await import('../../core/builders/vault.js');
  if (opts.json) { emit(buildVault(readJsonInput(opts.json)), opts); return; }
  emit(buildVault({
    backingCoin: opts.backingCoin, name: opts.name, symbol: opts.symbol, image: opts.image,
    description: opts.description, dailyWithdrawLimit: opts.dailyWithdrawLimit ? Number(opts.dailyWithdrawLimit) : undefined,
    require2fa: opts.require2fa, emergencyRecovery: opts.emergencyRecovery
  }), opts);
});

sharedOpts(
  templatesCommand
    .command('subscription')
    .description('Create a recurring subscription collection')
    .requiredOption('--interval <duration>', 'Interval: daily, monthly, annually, or shorthand (30d)')
    .option('--price <amount>', 'Price per interval (display units) — use with --denom/--recipient')
    .option('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .option('--recipient <address>', 'Payout address (bb1...)')
    .option('--payouts <json>', 'Multiple payouts JSON: [{"recipient","amount","denom"}]')
    .option('--tiers <n>', 'Number of tiers', '1')
    .option('--transferable', 'Allow post-mint P2P transfers')
    .option('--name <name>', 'Collection name', 'Subscription')
).action(async (opts) => {
  const { buildSubscription } = await import('../../core/builders/subscription.js');
  if (opts.json) { emit(buildSubscription(readJsonInput(opts.json)), opts); return; }
  const params: any = { interval: opts.interval, tiers: Number(opts.tiers), transferable: !!opts.transferable, name: opts.name };
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
  templatesCommand
    .command('bounty')
    .description('Create a bounty escrow collection')
    .requiredOption('--amount <n>', 'Bounty amount (display units)')
    .requiredOption('--denom <symbol>', 'Coin (USDC, BADGE)')
    .requiredOption('--verifier <address>', 'Verifier address (bb1...)')
    .requiredOption('--recipient <address>', 'Recipient address (bb1...)')
    .option('--expiration <duration>', 'Expiration duration', '30d')
    .option('--name <name>', 'Collection name', 'Bounty')
).action(async (opts) => {
  const { buildBounty } = await import('../../core/builders/bounty.js');
  if (opts.json) { emit(buildBounty(readJsonInput(opts.json)), opts); return; }
  emit(buildBounty({ amount: Number(opts.amount), denom: opts.denom, verifier: opts.verifier, recipient: opts.recipient, expiration: opts.expiration, name: opts.name }), opts);
});

sharedOpts(
  templatesCommand
    .command('crowdfund')
    .description('Create a crowdfunding collection')
    .requiredOption('--goal <n>', 'Funding goal (display units)')
    .requiredOption('--denom <symbol>', 'Coin (USDC, BADGE)')
    .option('--crowdfunder <address>', 'Who receives funds on success (bb1...)')
    .option('--deadline <duration>', 'Deadline duration', '30d')
    .option('--name <name>', 'Collection name', 'Crowdfund')
).action(async (opts) => {
  const { buildCrowdfund } = await import('../../core/builders/crowdfund.js');
  if (opts.json) { emit(buildCrowdfund(readJsonInput(opts.json)), opts); return; }
  emit(buildCrowdfund({ goal: Number(opts.goal), denom: opts.denom, crowdfunder: opts.crowdfunder, deadline: opts.deadline, name: opts.name }), opts);
});

sharedOpts(
  templatesCommand
    .command('auction')
    .description('Create an auction collection')
    .option('--bid-deadline <duration>', 'Bidding window', '7d')
    .option('--accept-window <duration>', 'Accept window after bid deadline', '7d')
    .option('--name <name>', 'Item name', 'Auction')
    .option('--description <text>', 'Item description')
    .option('--image <url>', 'Item image URL')
).action(async (opts) => {
  const { buildAuction } = await import('../../core/builders/auction.js');
  if (opts.json) { emit(buildAuction(readJsonInput(opts.json)), opts); return; }
  emit(buildAuction({ bidDeadline: opts.bidDeadline, acceptWindow: opts.acceptWindow, name: opts.name, description: opts.description, image: opts.image }), opts);
});

sharedOpts(
  templatesCommand
    .command('product-catalog')
    .description('Create a product catalog collection')
    .requiredOption('--products <json>', 'Product array JSON: [{"name","price","denom","maxSupply?","burn?"}]')
    .requiredOption('--store-address <address>', 'Payment recipient (bb1...)')
    .option('--name <name>', 'Collection name', 'Product Catalog')
).action(async (opts) => {
  const { buildProductCatalog } = await import('../../core/builders/product-catalog.js');
  if (opts.json) { emit(buildProductCatalog(readJsonInput(opts.json)), opts); return; }
  const products = JSON.parse(opts.products);
  emit(buildProductCatalog({ products, storeAddress: opts.storeAddress, name: opts.name }), opts);
});

sharedOpts(
  templatesCommand
    .command('prediction-market')
    .description('Create a binary prediction market (YES/NO)')
    .requiredOption('--verifier <address>', 'Market resolver address (bb1...)')
    .option('--denom <symbol>', 'Payment coin (default: USDC)', 'USDC')
    .option('--name <name>', 'Market question', 'Prediction Market')
    .option('--description <text>', 'Market details')
    .option('--image <url>', 'Market image URL')
).action(async (opts) => {
  const { buildPredictionMarket } = await import('../../core/builders/prediction-market.js');
  if (opts.json) { emit(buildPredictionMarket(readJsonInput(opts.json)), opts); return; }
  emit(buildPredictionMarket({ verifier: opts.verifier, denom: opts.denom, name: opts.name, description: opts.description, image: opts.image }), opts);
});

sharedOpts(
  templatesCommand
    .command('smart-account')
    .description('Create an IBC-backed smart account')
    .requiredOption('--backing-coin <symbol>', 'Backing coin (USDC, BADGE, ATOM, OSMO)')
    .option('--symbol <symbol>', 'Display symbol')
    .option('--image <url>', 'Token image URL')
    .option('--tradable', 'Enable liquidity pool trading')
    .option('--ai-agent-vault', 'Add AI Agent Vault standard tag')
).action(async (opts) => {
  const { buildSmartAccount } = await import('../../core/builders/smart-account.js');
  if (opts.json) { emit(buildSmartAccount(readJsonInput(opts.json)), opts); return; }
  emit(buildSmartAccount({ backingCoin: opts.backingCoin, symbol: opts.symbol, image: opts.image, tradable: !!opts.tradable, aiAgentVault: !!opts.aiAgentVault }), opts);
});

sharedOpts(
  templatesCommand
    .command('credit-token')
    .description('Create a credit/prepaid token')
    .requiredOption('--payment-denom <symbol>', 'Payment coin (USDC, BADGE)')
    .requiredOption('--recipient <address>', 'Payment recipient (bb1...)')
    .option('--symbol <symbol>', 'Token symbol', 'CREDIT')
    .option('--tokens-per-unit <n>', 'Tokens per 1 display unit of payment', '100')
    .option('--name <name>', 'Collection name', 'Credit Token')
).action(async (opts) => {
  const { buildCreditToken } = await import('../../core/builders/credit-token.js');
  if (opts.json) { emit(buildCreditToken(readJsonInput(opts.json)), opts); return; }
  emit(buildCreditToken({ paymentDenom: opts.paymentDenom, recipient: opts.recipient, symbol: opts.symbol, tokensPerUnit: Number(opts.tokensPerUnit), name: opts.name }), opts);
});

sharedOpts(
  templatesCommand
    .command('custom-2fa')
    .description('Create a custom 2FA token')
    .requiredOption('--name <name>', 'Token name')
    .option('--image <url>', 'Token image URL')
    .option('--description <text>', 'Description')
    .option('--burnable', 'Allow burning')
    .option('--transferable', 'Allow post-mint P2P transfers')
).action(async (opts) => {
  const { buildCustom2FA } = await import('../../core/builders/custom-2fa.js');
  if (opts.json) { emit(buildCustom2FA(readJsonInput(opts.json)), opts); return; }
  emit(buildCustom2FA({ name: opts.name, image: opts.image, description: opts.description, burnable: !!opts.burnable, transferable: !!opts.transferable }), opts);
});

sharedOpts(
  templatesCommand
    .command('quests')
    .description('Create a quest/reward collection')
    .requiredOption('--reward <n>', 'Reward per claim (display units)')
    .requiredOption('--denom <symbol>', 'Reward coin (USDC, BADGE)')
    .requiredOption('--max-claims <n>', 'Maximum number of claims')
    .option('--name <name>', 'Collection name', 'Quest')
).action(async (opts) => {
  const { buildQuests } = await import('../../core/builders/quests.js');
  if (opts.json) { emit(buildQuests(readJsonInput(opts.json)), opts); return; }
  emit(buildQuests({ reward: Number(opts.reward), denom: opts.denom, maxClaims: Number(opts.maxClaims), name: opts.name }), opts);
});

sharedOpts(
  templatesCommand
    .command('address-list')
    .description('Create an on-chain address list')
    .requiredOption('--name <name>', 'List name')
    .option('--image <url>', 'List image URL')
    .option('--description <text>', 'Description')
).action(async (opts) => {
  const { buildAddressList } = await import('../../core/builders/address-list.js');
  if (opts.json) { emit(buildAddressList(readJsonInput(opts.json)), opts); return; }
  emit(buildAddressList({ name: opts.name, image: opts.image, description: opts.description, manager: opts.manager }), opts);
});

// ============================================================
// Approval builders (user-level)
// ============================================================

sharedOpts(
  templatesCommand
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
  templatesCommand
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
  templatesCommand
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
  templatesCommand
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
  templatesCommand
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
  templatesCommand
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
