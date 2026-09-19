import { verifyBrowserReceipt } from './browser-receipt.js';
import { NETWORK_CONFIGS } from '../signing/types.js';
import type { BrowserTxRequestV2 } from './browser-signing.js';
import { buildSubscription } from './builders/subscription.js';
import { normalizeToCreateOrUpdate } from '../cli/utils/normalizeMsg.js';
const address = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
const hash = 'a'.repeat(64);
const request: Extract<BrowserTxRequestV2, { chain: 'cosmos' }> = { version: 2, requestId: 'b'.repeat(32), expectedAddress: address, network: 'local', chain: 'cosmos', chainId: NETWORK_CONFIGS.local.cosmosChainId, evmChainId: String(NETWORK_CONFIGS.local.evmChainId), expiresAt: Date.now() + 60_000, signOnly: false, txsInfo: [{ type: '/cosmos.bank.v1beta1.MsgSend', msg: { fromAddress: address, toAddress: address, amount: [{ denom: 'ubadge', amount: '1' }] } }] };
const result = { requestId: request.requestId, outcome: 'submitted', hash, address, network: request.network, chain: request.chain, chainId: request.chainId };
function chainResponse(overrides: any = {}) { return { tx: { body: { messages: [{ '@type': request.txsInfo[0].type, ...JSON.parse(JSON.stringify(request.txsInfo[0].msg)) }] } }, tx_response: { txhash: hash, height: '1', code: 0, events: [], ...overrides } }; }
function rpc(tx: any, chainId = request.chainId) { return jest.fn(async (url: any) => new Response(JSON.stringify(String(url).includes('node_info') ? { default_node_info: { network: chainId } } : tx), { status: 200 })); }
describe('independent browser completion receipts', () => {
  it('cancels oversized chunked responses before buffering the entire stream', async () => {
    let bytes = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { bytes += 65536; controller.enqueue(new Uint8Array(65536)); if (bytes === 4 * 1024 * 1024) controller.close(); },
      cancel() { cancelled = true; }
    });
    const receipt = await verifyBrowserReceipt(request, result, { fetch: jest.fn(async () => new Response(body)) as any });
    expect(receipt.status).toBe('unknown');
    expect(cancelled).toBe(true);
    expect(bytes).toBeLessThan(4 * 1024 * 1024);
  });
  it('preserves confirmation when indexing evidence is unavailable', async () => {
    const receipt = await verifyBrowserReceipt(request, result, { fetch: rpc(chainResponse()) as any });
    expect(receipt.status).toBe('confirmed'); expect(receipt.indexing).toBe('unknown');
  });
  it('checks an independently fetched network-bound completed block watermark', async () => {
    const checkpoint = { version: 1, network: request.network, chainId: request.chainId, evmChainId: request.evmChainId, completedThroughHeight: '1' };
    const fetcher = jest.fn(async (url: any, options: any) => {
      if (String(url).endsWith('/api/v0/status')) {
        expect(options.headers['x-api-key']).toBe('fixture-key');
        return new Response(JSON.stringify({ indexing: checkpoint }));
      }
      expect(options.headers?.['x-api-key']).toBeUndefined();
      return rpc(chainResponse())(url);
    });
    const options = { fetch: fetcher as any, indexerUrl: 'http://indexer.invalid', apiKey: 'fixture-key' };
    expect(await verifyBrowserReceipt(request, result, options)).toMatchObject({ status: 'indexed', confirmed: true, indexing: 'indexed', indexedHeight: '1', indexingScope: 'block-watermark' });
    checkpoint.completedThroughHeight = '0';
    expect(await verifyBrowserReceipt(request, result, options)).toMatchObject({ status: 'confirmed', indexing: 'pending' });
    for (const patch of [{ network: 'testnet' }, { chainId: 'wrong' }, { evmChainId: '1' }, { completedThroughHeight: '-1' }, { completedThroughHeight: 1 }, { version: 2 }]) {
      Object.assign(checkpoint, { version: 1, network: request.network, chainId: request.chainId, evmChainId: request.evmChainId, completedThroughHeight: '1' }, patch);
      expect(await verifyBrowserReceipt(request, result, options)).toMatchObject({ status: 'confirmed', confirmed: true, indexing: 'unknown' });
    }
  });
  it('does not query indexing for unsuccessful execution and can explicitly skip it', async () => {
    const failed = rpc(chainResponse({ code: 5 }));
    expect((await verifyBrowserReceipt(request, result, { fetch: failed as any })).indexing).toBe('not-checked');
    expect(failed).toHaveBeenCalledTimes(2);
    const successful = rpc(chainResponse());
    expect((await verifyBrowserReceipt(request, result, { fetch: successful as any, checkIndexer: false })).indexing).toBe('not-checked');
    expect(successful).toHaveBeenCalledTimes(2);
  });
  it('rejects matching-hash replies with changed messages, missing code or wrong network', async () => {
    const changed = chainResponse(); changed.tx.body.messages[0].amount[0].amount = '2';
    expect((await verifyBrowserReceipt(request, result, { fetch: rpc(changed) as any })).status).toBe('unknown');
    expect((await verifyBrowserReceipt(request, result, { fetch: rpc(chainResponse({ code: undefined })) as any })).status).toBe('unknown');
    expect((await verifyBrowserReceipt(request, result, { fetch: rpc(chainResponse(), 'wrong-chain') as any })).status).toBe('unknown');
  });
  it('distinguishes executed failures, pending responses and signed-only results', async () => {
    expect((await verifyBrowserReceipt(request, result, { fetch: rpc(chainResponse({ code: 5 })) as any })).status).toBe('failed');
    expect((await verifyBrowserReceipt(request, result, { fetch: (async () => new Response('', { status: 404 })) as any })).status).toBe('submitted');
    const fetcher = jest.fn();
    const signed = { ...result, outcome: 'signed', hash: undefined, signedTx: 'YQ==' }; delete signed.hash;
    expect((await verifyBrowserReceipt({ ...request, signOnly: true }, signed, { fetch: fetcher })).status).toBe('signed');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('checks EVM calldata and destination independently of wallet callback', async () => {
    const evm: BrowserTxRequestV2 = { version: 2, requestId: request.requestId, expectedAddress: address, network: 'local', chain: 'evm', chainId: request.evmChainId, evmChainId: request.evmChainId, expiresAt: request.expiresAt, signOnly: false, tx: { to: '0x' + '22'.repeat(20), value: '1', data: '0x1234' } };
    const callback = { ...result, chain: 'evm', chainId: evm.chainId, hash: '0x' + hash };
    const transaction = { hash: '0x' + hash, from: '0x' + '11'.repeat(20), to: evm.tx.to, value: '0x1', input: '0x1234' };
    const fetcher = jest.fn(async (_url, opts: any) => {
      if (!opts.body) return new Response(JSON.stringify({ indexing: { version: 1, network: 'local', chainId: request.chainId, evmChainId: request.evmChainId, completedThroughHeight: '1' } }));
      const method = JSON.parse(opts.body).method;
      const result = method === 'eth_chainId' ? '0x' + BigInt(evm.evmChainId).toString(16) : method === 'eth_getTransactionByHash' ? transaction : { transactionHash: '0x' + hash, status: '0x1', blockNumber: '0x1' };
      return new Response(JSON.stringify({ result }), { status: 200 });
    });
    expect((await verifyBrowserReceipt(evm, callback, { fetch: fetcher as any })).status).toBe('indexed');
    transaction.input = '0x';
    expect((await verifyBrowserReceipt(evm, callback, { fetch: fetcher as any })).status).toBe('unknown');
  });
  it('verifies actual subscription create messages and extracts only creation events', async () => {
    const msg = normalizeToCreateOrUpdate(buildSubscription({ interval: '30d', price: 5, denom: 'BADGE', recipient: address, uri: 'ipfs://fixture' }));
    msg.value.creator = address; msg.value.manager = address;
    delete msg.value._meta;
    const bound = { ...request, txsInfo: [{ type: msg.typeUrl, msg: msg.value }] };
    const data = chainResponse({ events: [
      { type: 'message', attributes: [{ key: 'collectionId', value: '99' }, { key: 'msg_type', value: 'transfer_tokens' }] },
      { type: 'message', attributes: [{ key: 'module', value: 'tokenization' }, { key: 'msg_type', value: 'universal_update_collection' }, { key: 'collectionId', value: '7' }, { key: 'msg', value: JSON.stringify({ collectionId: '0' }) }] }
    ] });
    data.tx.body.messages = [{ '@type': msg.typeUrl, ...msg.value }];
    const receipt = await verifyBrowserReceipt(bound, result, { fetch: rpc(data) as any });
    expect(receipt.status).toBe('confirmed'); expect(receipt.createdCollectionIds).toEqual(['7']);
  });
});
