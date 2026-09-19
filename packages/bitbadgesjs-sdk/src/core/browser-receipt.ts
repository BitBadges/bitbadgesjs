import { parseBrowserTxRequest, parseBrowserTxResult, browserRequestArtifact, type BrowserTxRequestV2 } from './browser-signing.js';
import { NETWORK_CONFIGS } from '../signing/types.js';
import { encodeMsgFromJson } from '../transactions/messages/fromJson.js';
import { convertToBitBadgesAddress, convertToEthAddress } from '../address-converter/converter.js';
import { artifactIdentity } from './intent.js';

export type BrowserReceipt = {
  version: 1; requestId: string; artifactId: string; chainId: string;
  status: 'signed' | 'submitted' | 'confirmed' | 'indexed' | 'failed' | 'unknown';
  indexing: 'not-checked' | 'pending' | 'indexed' | 'unknown'; indexedHeight?: string; indexingScope?: 'block-watermark'; confirmed: boolean; retrySafe: false;
  txHash?: string; height?: string; code?: number; createdCollectionIds: string[]; reason: string;
};
export type ReceiptOptions = { fetch?: typeof fetch; nodeUrl?: string; evmRpcUrl?: string; timeoutMs?: number; indexerUrl?: string; apiKey?: string; checkIndexer?: boolean };
const normalizedHash = (hash: string) => hash.replace(/^0x/i, '').toLowerCase();

export async function verifyBrowserReceipt(input: BrowserTxRequestV2, callback: unknown, options: ReceiptOptions = {}): Promise<BrowserReceipt> {
  const request = parseBrowserTxRequest(input, input.expiresAt - 1);
  const result = parseBrowserTxResult(callback, request);
  const base: BrowserReceipt = { version: 1, requestId: request.requestId, artifactId: artifactIdentity(browserRequestArtifact(request)), chainId: request.chainId,
    status: 'unknown', indexing: 'not-checked', confirmed: false, retrySafe: false, createdCollectionIds: [], reason: 'No independently verified execution.' };
  if (result.outcome === 'signed') return { ...base, status: 'signed', reason: 'Signed bytes are not proof of submission or execution.' };
  if (result.outcome !== 'submitted') return base;
  const submitted: BrowserReceipt = { ...base, status: 'submitted', txHash: result.hash, reason: 'Wallet reported submission; chain verification is pending.' };
  const config = NETWORK_CONFIGS[request.network];
  const timeout = options.timeoutMs ?? 10_000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 30_000) throw new Error('Invalid receipt verification timeout.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const get = async (url: string, body?: object, headers?: Record<string, string>) => {
    const response = await (options.fetch ?? fetch)(url, { signal: controller.signal, redirect: 'error', headers, ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('RPC unavailable');
    if (!response.body) throw new Error('Missing RPC body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let text = '';
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 2 * 1024 * 1024) {
          await reader.cancel();
          throw new Error('RPC output exceeds bound');
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    return JSON.parse(text);
  };
  const checkIndexed = async (receipt: BrowserReceipt): Promise<BrowserReceipt> => {
    if (!receipt.confirmed || options.checkIndexer === false) return receipt;
    try {
      const url = (options.indexerUrl ?? config.apiUrl).replace(/\/$/, '');
      const data = await get(url + '/api/v0/status', undefined, options.apiKey ? { 'x-api-key': options.apiKey } : undefined);
      const checkpoint = data?.indexing;
      if (checkpoint?.version !== 1 || checkpoint.network !== request.network || checkpoint.chainId !== config.cosmosChainId ||
          checkpoint.evmChainId !== String(config.evmChainId) || typeof checkpoint.completedThroughHeight !== 'string' ||
          !/^(0|[1-9][0-9]{0,19})$/.test(checkpoint.completedThroughHeight)) throw new Error('Unverified indexing checkpoint');
      const indexed = BigInt(checkpoint.completedThroughHeight) >= BigInt(receipt.height!);
      return { ...receipt, status: indexed ? 'indexed' : 'confirmed', indexing: indexed ? 'indexed' : 'pending', indexedHeight: checkpoint.completedThroughHeight,
        indexingScope: 'block-watermark', reason: indexed ? 'Exact transaction confirmed; configured indexer has durably completed its block. This does not verify every downstream view.' : 'Exact transaction confirmed; configured indexer has not yet completed its block.' };
    } catch {
      return { ...receipt, indexing: 'unknown', reason: 'Exact transaction confirmed; indexer completion could not be independently verified.' };
    }
  };
  try {
    if (request.chain === 'cosmos') {
      const url = (options.nodeUrl ?? config.nodeUrl).replace(/\/$/, '');
      const node = await get(url + '/cosmos/base/tendermint/v1beta1/node_info');
      if (node === null) return submitted;
      if (node?.default_node_info?.network !== request.chainId) throw new Error('Wrong chain');
      const data = await get(url + '/cosmos/tx/v1beta1/txs/' + normalizedHash(result.hash).toUpperCase());
      if (data === null) return submitted;
      const execution = data?.tx_response;
      const messages = data?.tx?.body?.messages;
      if (!execution || typeof execution.txhash !== 'string' || normalizedHash(execution.txhash) !== normalizedHash(result.hash) || !/^[1-9][0-9]*$/.test(String(execution.height)) ||
          !Number.isSafeInteger(execution.code) || execution.code < 0 || !Array.isArray(messages) || messages.length !== request.txsInfo.length) throw new Error('Missing or mismatched execution evidence');
      for (let index = 0; index < request.txsInfo.length; index++) {
        const expected = request.txsInfo[index];
        const actual = messages[index];
        if (actual?.['@type'] !== expected.type) throw new Error('Message type mismatch');
        const signer = expected.msg.creator ?? expected.msg.fromAddress ?? expected.msg.sender ?? expected.msg.delegatorAddress ?? expected.msg.granter ?? expected.msg.grantee;
        if (typeof signer !== 'string' || convertToBitBadgesAddress(signer) !== request.expectedAddress) throw new Error('Signer not bound in message');
        const encoded = encodeMsgFromJson({ typeUrl: expected.type, value: expected.msg });
        const { '@type': _type, ...value } = actual;
        const observed = encoded.getType().fromJson(value);
        const left = encoded.toBinary(); const right = observed.toBinary();
        if (left.length !== right.length || left.some((byte, offset) => byte !== right[offset])) throw new Error('Message content mismatch');
      }
      const createdCollectionIds: string[] = [];
      if (execution.code === 0) for (const event of execution.events ?? []) {
        if (event.type !== 'message') continue;
        const attrs = Object.fromEntries((event.attributes ?? []).map((attr: { key: string; value: string }) => [attr.key, attr.value]));
        if (attrs.module !== 'tokenization' || attrs.msg_type !== 'universal_update_collection' || typeof attrs.msg !== 'string') continue;
        let original: { collectionId?: string };
        try { original = JSON.parse(attrs.msg); } catch { continue; }
        if (original.collectionId === '0' && typeof attrs.collectionId === 'string' && /^[1-9][0-9]*$/.test(attrs.collectionId)) createdCollectionIds.push(attrs.collectionId);
      }
      return await checkIndexed({ ...submitted, status: execution.code === 0 ? 'confirmed' : 'failed', confirmed: execution.code === 0, height: String(execution.height), code: execution.code,
        createdCollectionIds: [...new Set(createdCollectionIds)], reason: execution.code === 0 ? 'Configured chain reports successful execution of the exact requested messages. Indexer state is not checked.' : 'Configured chain reports failed execution of the requested transaction.' });
    }
    const rpc = options.evmRpcUrl ?? config.evmRpcUrl;
    const query = async (method: string, params: string[]) => { const data = await get(rpc, { jsonrpc: '2.0', id: 1, method, params }); if (data?.error) throw new Error('RPC error'); return data?.result; };
    const chainId = await query('eth_chainId', []);
    if (typeof chainId !== 'string' || BigInt(chainId) !== BigInt(request.evmChainId)) throw new Error('Wrong chain');
    const hash = '0x' + normalizedHash(result.hash);
    const tx = await query('eth_getTransactionByHash', [hash]);
    const receipt = await query('eth_getTransactionReceipt', [hash]);
    if (!tx || !receipt) return submitted;
    if (normalizedHash(tx.hash) !== normalizedHash(hash) || normalizedHash(receipt.transactionHash) !== normalizedHash(hash) ||
      tx.from?.toLowerCase() !== convertToEthAddress(request.expectedAddress).toLowerCase() || tx.to?.toLowerCase() !== request.tx.to.toLowerCase() ||
      BigInt(tx.value) !== BigInt(request.tx.value ?? '0') || (tx.input ?? '0x').toLowerCase() !== (request.tx.data ?? '0x').toLowerCase() ||
      !['0x0', '0x1'].includes(receipt.status) || BigInt(receipt.blockNumber) <= 0n) throw new Error('EVM request/result mismatch');
    const confirmed = receipt.status === '0x1';
    return await checkIndexed({ ...submitted, status: confirmed ? 'confirmed' : 'failed', confirmed, height: BigInt(receipt.blockNumber).toString(), code: confirmed ? 0 : 1,
      reason: 'Configured EVM chain execution checked against requested signer, destination, value and calldata. Indexer state is not checked.' });
  } catch {
    return { ...submitted, status: 'unknown', reason: 'Execution could not be independently bound to the exact request and chain. Check wallet activity and chain status before retrying.' };
  } finally { clearTimeout(timer); }
}
