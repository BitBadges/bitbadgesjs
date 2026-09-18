import { buildSpendableCredit } from './builders/spendable-credit.js';
import { buildConsumeSpendableCreditsMsg, verifyEvmSpendableCreditReceipt } from './spendable-credits.js';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { MsgTransferTokens } from '../transactions/messages/bitbadges/tokenization/msgTransferTokens.js';
import { convertMessageToPrecompileCall, convertMessagesToExecuteMultiple } from '../transactions/precompile/utils.js';

const address = '0x1111111111111111111111111111111111111111';
const wallet = convertToBitBadgesAddress(address);
const collection = {
  ...buildSpendableCredit({
    paymentDenom: 'USDC',
    provider: wallet,
    serviceId: 'images',
    pricePerPack: '1000000',
    creditsPerPack: '10',
    uri: 'ipfs://image'
  }).value,
  collectionId: '1'
};
const request = { wallet, provider: wallet, serviceId: 'images', requestId: 'request-1', units: '2' };
const msg = new MsgTransferTokens(buildConsumeSpendableCreditsMsg(collection, request).value);
const call = convertMessageToPrecompileCall(msg, address);
const transaction = () => ({
  hash: '0x' + 'a'.repeat(64),
  from: address,
  to: call.precompileAddress,
  input: call.data,
  value: '0x0',
  chainId: '0x1',
  blockNumber: '0x2',
  blockHash: '0x' + 'b'.repeat(64)
});
const receipt = () => ({ transactionHash: transaction().hash, status: '0x1', blockNumber: '0x2', blockHash: transaction().blockHash });

const execution = () => ({
  code: 0,
  height: '2',
  tx: { body: { messages: [{ '@type': '/cosmos.evm.vm.v1.MsgEthereumTx' }] } },
  events: [
    { type: 'ethereum_tx', attributes: [{ key: 'ethereumTxHash', value: transaction().hash }] },
    {
      type: 'indexer',
      attributes: Object.entries({
        module: 'tokenization',
        msg_type: 'transfer_tokens',
        msg: JSON.stringify(buildConsumeSpendableCreditsMsg(collection, request).value)
      }).map(([key, value]) => ({ key, value }))
    }
  ]
});

test('accepts confirmed direct and single-message batch consumption from the holder', () => {
  expect(verifyEvmSpendableCreditReceipt(collection, transaction(), receipt(), request, '1', execution()).units).toBe('2');
  const batch = convertMessagesToExecuteMultiple([msg], address);
  expect(verifyEvmSpendableCreditReceipt(collection, { ...transaction(), input: batch.data }, receipt(), request, '1', execution()).units).toBe('2');
});
test('rejects wrong chain, sender, contract, calldata, failed/pending/mismatched receipt', () => {
  for (const patch of [
    { chainId: '0x2' },
    { from: '0x2222222222222222222222222222222222222222' },
    { to: address },
    { input: '0x' },
    { blockHash: null }
  ]) {
    expect(() => verifyEvmSpendableCreditReceipt(collection, { ...transaction(), ...patch }, receipt(), request, '1', execution())).toThrow();
  }
  for (const patch of [{ status: '0x0' }, { blockNumber: '0x0' }, { transactionHash: '0x' + 'c'.repeat(64) }]) {
    expect(() => verifyEvmSpendableCreditReceipt(collection, transaction(), { ...receipt(), ...patch }, request, '1', execution())).toThrow();
  }
  const batch = convertMessagesToExecuteMultiple([msg, msg], address);
  expect(() => verifyEvmSpendableCreditReceipt(collection, { ...transaction(), input: batch.data }, receipt(), request, '1', execution())).toThrow();
});

test('rejects successful no-op EVM receipts and mismatched native execution', () => {
  for (const patch of [
    undefined,
    { ...execution(), events: [] },
    { ...execution(), height: '3' },
    { ...execution(), code: 4 },
    { ...execution(), tx: { body: { messages: [{ '@type': '/tokenization.MsgTransferTokens' }] } } }
  ]) {
    expect(() => verifyEvmSpendableCreditReceipt(collection, transaction(), receipt(), request, '1', patch)).toThrow();
  }
  const wrongHash = execution();
  wrongHash.events[0].attributes[0].value = '0x' + 'f'.repeat(64);
  expect(() => verifyEvmSpendableCreditReceipt(collection, transaction(), receipt(), request, '1', wrongHash)).toThrow();
  const wrongBurn = execution();
  wrongBurn.events[1].attributes.find((item) => item.key === 'msg')!.value = JSON.stringify(
    buildConsumeSpendableCreditsMsg(collection, { ...request, units: '1' }).value
  );
  expect(() => verifyEvmSpendableCreditReceipt(collection, transaction(), receipt(), request, '1', wrongBurn)).toThrow();
});

test('rejects duplicate execution events and additional EVM hashes', () => {
  const duplicate = execution();
  duplicate.events.push(duplicate.events[1]);
  expect(() => verifyEvmSpendableCreditReceipt(collection, transaction(), receipt(), request, '1', duplicate)).toThrow();
  const mixed = execution();
  mixed.events.push({ type: 'ethereum_tx', attributes: [{ key: 'ethereumTxHash', value: '0x' + 'c'.repeat(64) }] });
  expect(() => verifyEvmSpendableCreditReceipt(collection, transaction(), receipt(), request, '1', mixed)).toThrow();
});
