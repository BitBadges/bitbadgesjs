import { Command } from 'commander';
import { output } from '../utils/io.js';

export const buildCommand = new Command('build').description('Template builders — generate MsgUniversalUpdateCollection or user approval JSON');

// ── Output helper ────────────────────────────────────────────────────────────

function emit(data: any, opts: { condensed?: boolean; outputFile?: string }) {
  output(data, { condensed: opts.condensed, outputFile: opts.outputFile });
}

const sharedOpts = (cmd: Command) =>
  cmd.option('--condensed', 'Output compact JSON (no whitespace)').option('--output-file <path>', 'Write output to file');

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
).action(async (opts) => {
  const { buildVault } = await import('../../core/builders/vault.js');
  emit(buildVault({ backingCoin: opts.backingCoin, name: opts.name, symbol: opts.symbol, image: opts.image, description: opts.description }), opts);
});

sharedOpts(
  buildCommand
    .command('subscription')
    .description('Create a recurring subscription collection')
    .requiredOption('--interval <duration>', 'Interval: daily, monthly, annually, or shorthand (30d)')
    .requiredOption('--price <amount>', 'Price per interval (display units)')
    .requiredOption('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .requiredOption('--recipient <address>', 'Payout address (bb1...)')
    .option('--tiers <n>', 'Number of tiers', '1')
    .option('--name <name>', 'Collection name', 'Subscription')
).action(async (opts) => {
  const { buildSubscription } = await import('../../core/builders/subscription.js');
  emit(buildSubscription({ interval: opts.interval, price: Number(opts.price), denom: opts.denom, recipient: opts.recipient, tiers: Number(opts.tiers), name: opts.name }), opts);
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
  emit(buildBounty({ amount: Number(opts.amount), denom: opts.denom, verifier: opts.verifier, recipient: opts.recipient, expiration: opts.expiration, name: opts.name }), opts);
});

sharedOpts(
  buildCommand
    .command('crowdfund')
    .description('Create a crowdfunding collection')
    .requiredOption('--goal <n>', 'Funding goal (display units)')
    .requiredOption('--denom <symbol>', 'Coin (USDC, BADGE)')
    .option('--deadline <duration>', 'Deadline duration', '30d')
    .option('--name <name>', 'Collection name', 'Crowdfund')
).action(async (opts) => {
  const { buildCrowdfund } = await import('../../core/builders/crowdfund.js');
  emit(buildCrowdfund({ goal: Number(opts.goal), denom: opts.denom, deadline: opts.deadline, name: opts.name }), opts);
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
).action(async (opts) => {
  const { buildSmartAccount } = await import('../../core/builders/smart-account.js');
  emit(buildSmartAccount({ backingCoin: opts.backingCoin, symbol: opts.symbol, image: opts.image, tradable: !!opts.tradable }), opts);
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
    .requiredOption('--pay-denom <symbol>', 'What you send (USDC, BADGE)')
    .requiredOption('--pay-amount <n>', 'Amount you send (display units)')
    .requiredOption('--receive-denom <symbol>', 'What you receive (USDC, BADGE)')
    .requiredOption('--receive-amount <n>', 'Amount you receive (display units)')
    .option('--expiration <duration>', 'How long intent stays open', '7d')
).action(async (opts) => {
  const { buildIntent } = await import('../../core/builders/intent.js');
  emit(buildIntent({ address: opts.address, payDenom: opts.payDenom, payAmount: Number(opts.payAmount), receiveDenom: opts.receiveDenom, receiveAmount: Number(opts.receiveAmount), expiration: opts.expiration }), opts);
});

sharedOpts(
  buildCommand
    .command('recurring-payment')
    .description('Create a recurring payment approval (user incoming)')
    .requiredOption('--amount <n>', 'Payment amount per interval (display units)')
    .requiredOption('--denom <symbol>', 'Payment coin (USDC, BADGE)')
    .requiredOption('--interval <duration>', 'Payment interval (daily, monthly, annually)')
    .requiredOption('--recipient <address>', 'Who receives payments (bb1...)')
    .option('--expiration <duration>', 'How long subscription lasts', '365d')
).action(async (opts) => {
  const { buildRecurringPayment } = await import('../../core/builders/recurring-payment.js');
  emit(buildRecurringPayment({ amount: Number(opts.amount), denom: opts.denom, interval: opts.interval, recipient: opts.recipient, expiration: opts.expiration }), opts);
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
  emit(buildBid({ address: opts.address, collectionId: opts.collectionId, tokenIds: opts.tokenIds, price: Number(opts.price), denom: opts.denom, expiration: opts.expiration }), opts);
});
