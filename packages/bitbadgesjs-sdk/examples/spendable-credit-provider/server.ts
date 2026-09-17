import { Database } from 'bun:sqlite';
import { CreditReceiptLedger } from './ledger.js';
import { inspectSpendableCredit, verifySpendableCreditReceipt, verifyEvmSpendableCreditReceipt } from '../../src/core/spendable-credits.js';

export function createProviderHandler(options: {
  db: Database;
  collectionId: string;
  chainId: string;
  provider: string;
  serviceId: string;
  units: string;
  nodeUrl: string;
  evmRpcUrl?: string;
  evmChainId?: string;
  authenticate: (request: Request) => Promise<string>;
}) {
  const ledger = new CreditReceiptLedger(options.db);
  const read = async (path: string) => {
    const response = await fetch(`${options.nodeUrl.replace(/\/$/, '')}${path}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Chain response unavailable; retry this request without consuming again.');
    return response.json() as Promise<any>;
  };
  return async (request: Request): Promise<Response> => {
    try {
      const wallet = await options.authenticate(request);
      if (!wallet) return Response.json({ error: 'Authentication required.' }, { status: 401 });
      const path = new URL(request.url).pathname;
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      if (path === '/requests') {
        return Response.json(
          ledger.issue({ wallet, collectionId: options.collectionId, provider: options.provider, serviceId: options.serviceId, units: options.units })
        );
      }
      if (path !== '/fulfill') return new Response(null, { status: 404 });
      const body = (await request.json()) as { requestId: string; secret: string; txHash: string };
      const terms = ledger.get(body.requestId, body.secret);
      if (terms.wallet !== wallet) return Response.json({ error: 'Request belongs to another customer.' }, { status: 403 });
      if (!/^(0x)?[A-Fa-f0-9]{64}$/i.test(body.txHash)) throw new Error('Invalid transaction hash.');
      const previous = ledger.replay(body.requestId, body.secret, wallet, body.txHash);
      if (previous) return Response.json(previous);
      const network = await read('/cosmos/base/tendermint/v1beta1/node_info');
      if (network.default_node_info?.network !== options.chainId) throw new Error('Wrong provider chain.');
      const { collection } = await read(`/bitbadges/bitbadgeschain/tokenization/get_collection/${options.collectionId}`);
      const config = inspectSpendableCredit(collection);
      if (config.provider !== options.provider || config.serviceId !== options.serviceId) throw new Error('Wrong provider collection.');
      if (/^0x/i.test(body.txHash)) {
        if (!options.evmRpcUrl || !options.evmChainId) throw new Error('Provider EVM receipt verification is not configured.');
        const rpc = async (method: string, params: string[]) => {
          const response = await fetch(options.evmRpcUrl!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
            signal: AbortSignal.timeout(10000)
          });
          const result = (await response.json()) as any;
          if (!response.ok || result.error || result.result === null) throw new Error('EVM confirmation unavailable; retry the same request.');
          return result.result;
        };
        if (BigInt(await rpc('eth_chainId', [])) !== BigInt(options.evmChainId)) throw new Error('Wrong provider EVM chain.');
        const hash = body.txHash.toLowerCase();
        const [transaction, receipt] = await Promise.all([rpc('eth_getTransactionByHash', [hash]), rpc('eth_getTransactionReceipt', [hash])]);
        if (transaction.hash?.toLowerCase() !== hash) throw new Error('EVM transaction hash mismatch.');
        const executions = await read(`/cosmos/tx/v1beta1/txs?query=${encodeURIComponent("ethereum_tx.ethereumTxHash='" + hash + "'")}`);
        if (executions.tx_responses?.length !== 1) throw new Error('Native execution is not yet available; retry the same request.');
        const execution = { ...executions.tx_responses[0], tx: executions.txs?.[0] ?? executions.tx_responses[0].tx };
        return Response.json(
          ledger.accept(
            body.requestId,
            body.secret,
            verifyEvmSpendableCreditReceipt(collection, transaction, receipt, terms, options.evmChainId, execution)
          )
        );
      }
      const result = await read(`/cosmos/tx/v1beta1/txs/${body.txHash}`);
      const response = { ...result.tx_response, tx: result.tx ?? result.tx_response?.tx };
      if (response.txhash?.toUpperCase() !== body.txHash.toUpperCase()) throw new Error('Transaction hash mismatch.');
      const receipt = verifySpendableCreditReceipt(collection, response, terms);
      return Response.json(ledger.accept(body.requestId, body.secret, receipt));
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Request failed.' }, { status: 400 });
    }
  };
}

if (import.meta.main) {
  const required = (key: string) => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing ${key}`);
    return value;
  };
  const customerKey = required('CUSTOMER_API_KEY');
  const wallet = required('CUSTOMER_WALLET');
  Bun.serve({
    hostname: '127.0.0.1',
    port: Number(process.env.PORT ?? '3099'),
    fetch: createProviderHandler({
      db: new Database(required('CREDIT_LEDGER_PATH')),
      nodeUrl: required('CHAIN_REST_URL'),
      chainId: required('CHAIN_ID'),
      collectionId: required('COLLECTION_ID'),
      provider: required('PROVIDER_ADDRESS'),
      serviceId: required('SERVICE_ID'),
      units: required('SERVICE_UNITS'),
      evmRpcUrl: required('EVM_RPC_URL'),
      evmChainId: required('EVM_CHAIN_ID'),
      authenticate: async (request) => (request.headers.get('authorization') === `Bearer ${customerKey}` ? wallet : '')
    })
  });
}
