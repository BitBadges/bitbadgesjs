import { buildSpendableCredit } from './builders/spendable-credit.js';
import { BURN_ADDRESS, FOREVER, MAX_UINT64 } from './builders/shared.js';
import { isAddressValid, convertToBitBadgesAddress } from '../address-converter/converter.js';
import { MsgTransferTokens } from '../transactions/messages/bitbadges/tokenization/msgTransferTokens.js';
import { convertMessageToPrecompileCall, convertMessagesToExecuteMultiple } from '../transactions/precompile/utils.js';

export type SpendableCreditRequest = { provider: string; serviceId: string; wallet: string; requestId: string; units: string };

function canonical(value: any): any {
  if (value === null || value === undefined || value === false || value === '' || value === '0' || value === 0 || value === 0n) return undefined;
  if (typeof value === 'bigint' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const entries = value.map(canonical).filter((entry) => entry !== undefined);
    return entries.length ? entries : undefined;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonical(entry)])
      .filter(([, entry]) => entry !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}
const same = (a: any, b: any) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const approvalTerms = ({ uri, customData, version, details, fromList, toList, initiatedByList, ...terms }: any) => terms;

export function inspectSpendableCredit(collection: any) {
  const config = JSON.parse(collection.customData ?? '{}').spendableCredit;
  if (config?.version !== 1 || !collection.standards?.includes('Spendable Credit') || collection.isArchived)
    throw new Error('Unsupported spendable credit collection.');
  const mint = collection.collectionApprovals?.find((a: any) => a.approvalId === 'spendable-purchase');
  const consume = collection.collectionApprovals?.find((a: any) => a.approvalId === 'spendable-consume');
  const coin = mint?.approvalCriteria?.coinTransfers?.[0]?.coins?.[0];
  const creditsPerPack = String(mint?.approvalCriteria?.predeterminedBalances?.incrementedBalances?.startBalances?.[0]?.amount ?? '');
  const expiresAt = String(mint?.transferTimes?.[0]?.end ?? '');
  const expected = buildSpendableCredit({
    provider: config.provider,
    serviceId: config.serviceId,
    paymentDenom: coin?.denom,
    pricePerPack: String(coin?.amount ?? ''),
    creditsPerPack,
    expiresAt,
    uri: 'ipfs://validation'
  }).value;
  if (
    collection.collectionApprovals.length !== 2 ||
    !same(approvalTerms(mint), approvalTerms(expected.collectionApprovals[0])) ||
    !same(approvalTerms(consume), approvalTerms(expected.collectionApprovals[1]))
  )
    throw new Error('Custom spendable credit approvals are unsupported.');
  for (const field of ['collectionPermissions', 'invariants', 'validTokenIds', 'defaultBalances']) {
    const actual =
      field === 'collectionPermissions'
        ? {
            ...collection[field],
            canUpdateCollectionApprovals: collection[field]?.canUpdateCollectionApprovals?.map(
              ({ fromList, toList, initiatedByList, ...permission }: any) => permission
            )
          }
        : collection[field];
    if (!same(actual, expected[field])) throw new Error(`Unsupported spendable credit ${field}.`);
  }
  if (
    (collection.aliasPaths ?? collection.aliasPathsToAdd ?? []).length ||
    (collection.cosmosCoinWrapperPaths ?? collection.cosmosCoinWrapperPathsToAdd ?? []).length
  )
    throw new Error('Wrapped spendable credits are unsupported.');
  return {
    provider: config.provider as string,
    serviceId: config.serviceId as string,
    paymentDenom: coin.denom as string,
    pricePerPack: String(coin.amount),
    creditsPerPack,
    expiresAt,
    mint,
    consume
  };
}

function transfer(collection: any, creator: string, from: string, to: string, amount: string, approval: any, memo: string) {
  if (!creator.startsWith('bb1') || !isAddressValid(creator)) throw new Error('A valid holder wallet is required.');
  if (!/^[1-9][0-9]*$/.test(amount) || BigInt(amount) > BigInt(MAX_UINT64)) throw new Error('Amount must be a positive uint64 integer.');
  if (!/^[1-9][0-9]*$/.test(String(collection.collectionId))) throw new Error('A deployed collection is required.');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collection.collectionId),
      transfers: [
        {
          from,
          toAddresses: [to],
          balances: [{ amount, tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
          prioritizedApprovals: [
            { approvalId: approval.approvalId, approvalLevel: 'collection', approverAddress: '', version: String(approval.version ?? '0') }
          ],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo
        }
      ]
    }
  };
}

export function buildPurchaseSpendableCreditsMsg(collection: any, wallet: string, packs: string) {
  const config = inspectSpendableCredit(collection);
  if (!/^[1-9][0-9]*$/.test(packs)) throw new Error('Packs must be a positive whole number.');
  if (BigInt(packs) * BigInt(config.pricePerPack) > BigInt(MAX_UINT64)) throw new Error('Payment total exceeds uint64 range.');
  return transfer(collection, wallet, 'Mint', wallet, String(BigInt(packs) * BigInt(config.creditsPerPack)), config.mint, '');
}

export function buildConsumeSpendableCreditsMsg(collection: any, request: SpendableCreditRequest) {
  const config = inspectSpendableCredit(collection);
  if (config.provider !== request.provider || config.serviceId !== request.serviceId)
    throw new Error('Provider or service does not match the collection.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(request.requestId))
    throw new Error('Request ID must contain 1–128 letters, digits, dots, underscores, or hyphens.');
  return transfer(
    collection,
    request.wallet,
    request.wallet,
    BURN_ADDRESS,
    request.units,
    config.consume,
    JSON.stringify({ spendableCredit: 1, provider: request.provider, serviceId: request.serviceId, requestId: request.requestId })
  );
}

/** Verify a response fetched by the provider from its trusted chain node, never a client-supplied response. */
export function verifySpendableCreditReceipt(collection: any, response: any, request: SpendableCreditRequest) {
  const expected = buildConsumeSpendableCreditsMsg(collection, request).value;
  if (response.code !== 0 || !/^[1-9][0-9]*$/.test(String(response.height)) || !/^[A-Fa-f0-9]{64}$/.test(response.txhash ?? ''))
    throw new Error('A confirmed successful transaction is required.');
  const matches: { messageIndex: number; transferIndex: number }[] = [];
  for (const [messageIndex, message] of (response.tx?.body?.messages ?? []).entries()) {
    if (
      message['@type'] !== '/tokenization.MsgTransferTokens' ||
      message.creator !== request.wallet ||
      String(message.collectionId) !== expected.collectionId
    )
      continue;
    for (const [transferIndex, item] of (message.transfers ?? []).entries()) {
      if (same(item, expected.transfers[0])) matches.push({ messageIndex, transferIndex });
    }
  }
  if (matches.length !== 1) throw new Error('Transaction must contain exactly one matching consumption receipt.');
  const { messageIndex, transferIndex } = matches[0];
  return {
    provider: request.provider,
    serviceId: request.serviceId,
    wallet: request.wallet,
    requestId: request.requestId,
    units: request.units,
    collectionId: expected.collectionId,
    txHash: response.txhash.toUpperCase() as string,
    height: String(response.height),
    receiptId: `${response.txhash.toUpperCase()}:${messageIndex}:${transferIndex}`
  };
}

/** Validate transaction and receipt fetched from the provider's trusted EVM node. Nested contract calls are unsupported. */
export function inspectEvmSpendableCreditSubmission(
  collection: any,
  transaction: any,
  receipt: any,
  request: SpendableCreditRequest,
  evmChainId: string
) {
  const message = new MsgTransferTokens(buildConsumeSpendableCreditsMsg(collection, request).value);
  if (
    !/^0x[0-9a-f]{64}$/i.test(transaction?.hash ?? '') ||
    transaction.hash.toLowerCase() !== receipt?.transactionHash?.toLowerCase() ||
    BigInt(transaction.chainId) !== BigInt(evmChainId)
  )
    throw new Error('EVM transaction identity or chain mismatch.');
  if (
    !/^0x[0-9a-f]{64}$/i.test(transaction.blockHash ?? '') ||
    transaction.blockHash.toLowerCase() !== receipt.blockHash?.toLowerCase() ||
    BigInt(transaction.blockNumber) <= 0n ||
    BigInt(transaction.blockNumber) !== BigInt(receipt.blockNumber) ||
    ![0n, 1n].includes(BigInt(receipt.status))
  )
    throw new Error('A confirmed successful EVM receipt is required.');
  if (convertToBitBadgesAddress(transaction.from) !== request.wallet || BigInt(transaction.value) !== 0n)
    throw new Error('EVM consumption must be submitted directly by the holder.');
  const single = convertMessageToPrecompileCall(message, transaction.from);
  const batch = convertMessagesToExecuteMultiple([message], transaction.from);
  if (
    transaction.to?.toLowerCase() !== single.precompileAddress.toLowerCase() ||
    ![single.data.toLowerCase(), batch.data.toLowerCase()].includes(transaction.input?.toLowerCase())
  )
    throw new Error('EVM calldata does not match the requested consumption.');
  return { successful: BigInt(receipt.status) === 1n };
}

export function verifyEvmSpendableCreditReceipt(
  collection: any,
  transaction: any,
  receipt: any,
  request: SpendableCreditRequest,
  evmChainId: string,
  execution: any
) {
  if (!inspectEvmSpendableCreditSubmission(collection, transaction, receipt, request, evmChainId).successful)
    throw new Error('EVM consumption failed.');
  const messages = execution?.tx?.body?.messages;
  if (
    execution?.code !== 0 ||
    String(execution.height) !== BigInt(receipt.blockNumber).toString() ||
    messages?.length !== 1 ||
    messages[0]['@type'] !== '/cosmos.evm.vm.v1.MsgEthereumTx'
  )
    throw new Error('Confirmed native execution evidence is required.');
  const attributes = (event: any) => Object.fromEntries((event.attributes ?? []).map((item: any) => [item.key, item.value]));
  const hashes = (execution.events ?? [])
    .filter((event: any) => event.type === 'ethereum_tx')
    .map(attributes)
    .map((item: any) => item.ethereumTxHash?.toLowerCase())
    .filter(Boolean);
  if (!hashes.length || hashes.some((hash: string) => hash !== transaction.hash.toLowerCase()))
    throw new Error('Native execution does not belong to this EVM transaction.');
  const transfers = (execution.events ?? [])
    .filter((event: any) => event.type === 'indexer')
    .map(attributes)
    .filter((item: any) => item.module === 'tokenization' && item.msg_type === 'transfer_tokens');
  if (transfers.length !== 1 || !same(JSON.parse(transfers[0].msg), buildConsumeSpendableCreditsMsg(collection, request).value))
    throw new Error('Exact successful tokenization execution is required.');
  return {
    provider: request.provider,
    serviceId: request.serviceId,
    wallet: request.wallet,
    requestId: request.requestId,
    units: request.units,
    collectionId: String(collection.collectionId),
    txHash: transaction.hash.toUpperCase() as string,
    height: BigInt(receipt.blockNumber).toString(),
    receiptId: `${transaction.hash.toUpperCase()}:0:0`
  };
}
