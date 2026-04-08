import { Command } from 'commander';
import { output, readJsonInput } from '../utils/io.js';

export const buildCommand = new Command('build').description('Template builders — generate MsgUniversalUpdateCollection or user approval JSON');

// ── Output helper ────────────────────────────────────────────────────────────

async function emit(data: any, opts: { condensed?: boolean; outputFile?: string; dryRun?: boolean; explain?: boolean }) {
  // --dry-run: run verifyStandardsCompliance and print violations
  if (opts.dryRun && data.typeUrl?.includes('MsgUniversalUpdateCollection')) {
    const { verifyStandardsCompliance } = await import('../../core/verify-standards.js');
    const result = verifyStandardsCompliance({ messages: [data] });
    if (result.valid) {
      process.stderr.write(`✓ Passes all standard checks (${result.standardsChecked.length} checks run)\n`);
    } else {
      process.stderr.write(`✗ ${result.violations.length} violation(s) found:\n`);
      for (const v of result.violations) {
        process.stderr.write(`  [${v.standard}] ${v.field}: ${v.message}\n`);
        if (v.fix) process.stderr.write(`    Fix: ${v.fix}\n`);
      }
    }
  }

  // --explain: run interpretTransaction and print human-readable summary
  if (opts.explain && data.typeUrl?.includes('MsgUniversalUpdateCollection')) {
    const { interpretTransaction } = await import('../../core/interpret-transaction.js');
    const explanation = interpretTransaction(data.value);
    process.stderr.write('\n── Explanation ──\n' + explanation + '\n');
  }

  output(data, { condensed: opts.condensed, outputFile: opts.outputFile });
}

const sharedOpts = (cmd: Command) =>
  cmd
    .option('--condensed', 'Output compact JSON (no whitespace)')
    .option('--output-file <path>', 'Write output to file')
    .option('--json <input>', 'Pass all params as JSON (file, inline, or - for stdin). Overrides individual flags.')
    .option('--dry-run', 'Validate output against standard checks (violations to stderr)')
    .option('--explain', 'Print human-readable explanation of the output (to stderr)');

/**
 * Merge CLI flags with --json input. JSON takes precedence for overlapping keys.
 */
function mergeParams(opts: any, flagMap: Record<string, string | ((v: string) => any)>): any {
  let jsonParams: any = {};
  if (opts.json) {
    jsonParams = readJsonInput(opts.json);
  }

  const flagParams: any = {};
  for (const [flag, key] of Object.entries(flagMap)) {
    if (opts[flag] !== undefined) {
      if (typeof key === 'function') {
        flagParams[flag] = key(opts[flag]);
      } else {
        flagParams[key] = opts[flag];
      }
    }
  }

  return { ...flagParams, ...jsonParams };
}

// ============================================================
// Collection builders
// ============================================================

sharedOpts(
  buildCommand
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
  buildCommand
    .command('subscription')
    .description('Create a recurring subscription collection')
    .requiredOption('--interval <duration>', 'Interval: daily, monthly, annually, or shorthand (30d)')
    .option('--price <amount>', 'Price per interval (display units) — use with --denom/--recipient')
    .option('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .option('--recipient <address>', 'Payout address (bb1...)')
    .option('--payouts <json>', 'Multiple payouts JSON: [{"recipient","amount","denom"}]')
    .option('--tiers <n>', 'Number of tiers', '1')
    .option('--name <name>', 'Collection name', 'Subscription')
).action(async (opts) => {
  const { buildSubscription } = await import('../../core/builders/subscription.js');
  if (opts.json) { emit(buildSubscription(readJsonInput(opts.json)), opts); return; }
  const params: any = { interval: opts.interval, tiers: Number(opts.tiers), name: opts.name };
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
  buildCommand
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
  buildCommand
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
  buildCommand
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
  buildCommand
    .command('prediction-market')
    .description('Create a binary prediction market (YES/NO)')
    .requiredOption('--verifier <address>', 'Market resolver address (bb1...)')
    .option('--name <name>', 'Market question', 'Prediction Market')
    .option('--description <text>', 'Market details')
    .option('--image <url>', 'Market image URL')
).action(async (opts) => {
  const { buildPredictionMarket } = await import('../../core/builders/prediction-market.js');
  if (opts.json) { emit(buildPredictionMarket(readJsonInput(opts.json)), opts); return; }
  emit(buildPredictionMarket({ verifier: opts.verifier, name: opts.name, description: opts.description, image: opts.image }), opts);
});

sharedOpts(
  buildCommand
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
  buildCommand
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
  buildCommand
    .command('custom-2fa')
    .description('Create a custom 2FA token')
    .requiredOption('--name <name>', 'Token name')
    .option('--image <url>', 'Token image URL')
    .option('--description <text>', 'Description')
    .option('--burnable', 'Allow burning')
).action(async (opts) => {
  const { buildCustom2FA } = await import('../../core/builders/custom-2fa.js');
  if (opts.json) { emit(buildCustom2FA(readJsonInput(opts.json)), opts); return; }
  emit(buildCustom2FA({ name: opts.name, image: opts.image, description: opts.description, burnable: !!opts.burnable }), opts);
});

sharedOpts(
  buildCommand
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
  buildCommand
    .command('address-list')
    .description('Create an on-chain address list')
    .requiredOption('--name <name>', 'List name')
    .option('--image <url>', 'List image URL')
    .option('--description <text>', 'Description')
).action(async (opts) => {
  const { buildAddressList } = await import('../../core/builders/address-list.js');
  if (opts.json) { emit(buildAddressList(readJsonInput(opts.json)), opts); return; }
  emit(buildAddressList({ name: opts.name, image: opts.image, description: opts.description }), opts);
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
