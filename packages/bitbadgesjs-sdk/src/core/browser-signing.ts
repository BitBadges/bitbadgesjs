import { z } from 'zod';
import { convertToBitBadgesAddress, isAddressValid } from '../address-converter/converter.js';
import { NETWORK_CONFIGS } from '../signing/types.js';
import { artifactIdentity, intentSchema, parseIntent } from './intent.js';

export type BrowserJsonValue = null | boolean | string | number | BrowserJsonValue[] | { [key: string]: BrowserJsonValue };
const jsonValue: z.ZodType<BrowserJsonValue> = z.lazy(() => z.union([
  z.null(), z.boolean(), z.string(), z.number().finite().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
  z.array(jsonValue), z.record(jsonValue)
]));
const network = z.enum(['mainnet', 'testnet', 'local']);
const address = z.string().refine(value => isAddressValid(value), 'Invalid signer address')
  .transform(value => convertToBitBadgesAddress(value))
  .refine(value => value.startsWith('bb1') && isAddressValid(value), 'A wallet account address is required');
const evidenceStatus = z.enum(['satisfied', 'violated', 'unverified']);
export const browserReviewSchema = z.object({
  version: z.literal(1), artifactId: z.string().regex(/^[a-f0-9]{64}$/), intent: intentSchema,
  binding: z.object({ expectedAddress: address, network, chainId: z.string().min(1) }).strict(),
  stateHeight: z.string().regex(/^[0-9]+$/).optional(),
  evidence: z.object({ version: z.literal(1), artifactId: z.string(), intentId: z.string(), checkedAt: z.string().regex(/^[0-9]+$/), status: evidenceStatus,
    maturity: z.literal('experimental').optional(), scope: z.literal('initial-artifact-configuration').optional(),
    requirements: z.array(z.object({ requirementId: z.string(), status: evidenceStatus, source: z.enum(['static', 'lifecycle', 'none']), paths: z.array(z.string()), reason: z.string() }).strict()).max(100),
    coverage: z.object({ executed: z.array(z.string()), unverified: z.array(z.string()) }).strict()
  }).strict().optional()
}).strict();
export type BrowserReviewSidecar = z.infer<typeof browserReviewSchema>;
const requestIdentity = {
  version: z.literal(2),
  requestId: z.string().regex(/^[a-f0-9]{32}$/),
  expectedAddress: address,
  network,
  chainId: z.string().min(1),
  evmChainId: z.string().regex(/^[1-9][0-9]*$/),
  expiresAt: z.number().int().safe().positive(),
  signOnly: z.boolean(),
  review: browserReviewSchema.optional()
};
const txsInfo = z.array(z.object({
    type: z.string().min(1).max(256), msg: z.record(jsonValue)
  }).strict()).min(1).max(100);
const evmTx = z.object({
    to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    value: z.string().regex(/^(0|[1-9][0-9]*)$/).optional(),
    data: z.string().regex(/^0x([0-9a-fA-F]{2})*$/).optional()
  }).strict();
const requestSchema = z.discriminatedUnion('chain', [
  z.object({ ...requestIdentity, chain: z.literal('cosmos'), txsInfo }).strict(),
  z.object({ ...requestIdentity, chain: z.literal('evm'), tx: evmTx }).strict()
]);

export type BrowserTxRequestV2 = z.infer<typeof requestSchema>;
export function browserRequestArtifact(request: BrowserTxRequestV2) {
  return request.chain === 'cosmos' ? { messages: request.txsInfo.map(message => ({ typeUrl: message.type, value: message.msg })) } : { tx: request.tx };
}

const legacyIdentity = {
  expectedAddress: address.optional(),
  chainId: z.string().min(1).optional(),
  signOnly: z.boolean().optional(),
  chainHint: z.enum(['cosmos', 'evm']).optional(),
  mode: z.literal('tx').optional()
};
const legacyRequestSchema = z.discriminatedUnion('chain', [
  z.object({ ...legacyIdentity, chain: z.literal('cosmos'), txsInfo }).strict(),
  z.object({ ...legacyIdentity, chain: z.literal('evm'), tx: evmTx }).strict()
]);
export type LegacyBrowserTxRequest = z.infer<typeof legacyRequestSchema>;

export function parseLegacyBrowserTxRequest(input: unknown): LegacyBrowserTxRequest {
  const request = legacyRequestSchema.parse(input);
  if (request.chain === 'evm' && request.signOnly) throw new Error('Sign-only is unsupported for EVM transactions');

  return request;
}

/** Validate the transport contract; supported message semantics are checked by the signing adapter. */
export function parseBrowserTxRequest(input: unknown, now = Date.now()): BrowserTxRequestV2 {
  const request = requestSchema.parse(input);
  if (request.expiresAt <= now || request.expiresAt > now + 30 * 60 * 1000) throw new Error('Browser signing request expired or exceeds the 30 minute lifetime');
  const config = NETWORK_CONFIGS[request.network];
  if (request.evmChainId !== String(config.evmChainId) || request.chainId !== (request.chain === 'cosmos' ? config.cosmosChainId : String(config.evmChainId))) {
    throw new Error('Browser signing request network and chain IDs disagree');
  }
  if (request.chain === 'evm' && request.signOnly) throw new Error('Sign-only is unsupported for EVM transactions');
  if (request.review) {
    const review = request.review;
    parseIntent(review.intent);
    if (JSON.stringify(review).length > 32 * 1024) throw new Error('Browser review sidecar exceeds 32 KiB.');
    if (review.artifactId !== artifactIdentity(browserRequestArtifact(request)) || review.binding.expectedAddress !== request.expectedAddress || review.binding.network !== request.network || review.binding.chainId !== request.chainId) throw new Error('Browser review is stale or belongs to another artifact, signer or network.');
    if (review.evidence && (review.evidence.artifactId !== review.artifactId || review.evidence.intentId !== artifactIdentity(review.intent))) throw new Error('Browser evidence is not bound to the reviewed artifact and intent.');
  }
  return request;
}

export function assertBrowserRequestBinding(
  request: BrowserTxRequestV2,
  binding: { address: string; network: string; chainId: string; evmChainId: string },
  now = Date.now()
): void {
  parseBrowserTxRequest(request, now);
  if (!isAddressValid(binding.address) || convertToBitBadgesAddress(binding.address) !== request.expectedAddress) throw new Error('Connected wallet does not match the requested signer');
  if (binding.network !== request.network || binding.chainId !== request.chainId || binding.evmChainId !== request.evmChainId) throw new Error('Connected network does not match the signing request');
}

const resultIdentity = { requestId: requestIdentity.requestId, address, network, chain: z.enum(['cosmos', 'evm']), chainId: z.string().min(1) };
export const BROWSER_SIGNED_TX_MAX_BASE64_LENGTH = 4096;
const resultSchema = z.discriminatedUnion('outcome', [
  z.object({ ...resultIdentity, outcome: z.literal('submitted'), hash: z.string().regex(/^(0x)?[0-9a-fA-F]{64}$/) }).strict(),
  z.object({ ...resultIdentity, outcome: z.literal('signed'), signedTx: z.string().min(4).max(BROWSER_SIGNED_TX_MAX_BASE64_LENGTH, 'Signed bytes exceed the browser callback size limit; use another signing flow.').regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/) }).strict(),
  z.object({ requestId: requestIdentity.requestId, outcome: z.literal('cancelled'), error: z.string().max(500).optional() }).strict(),
  z.object({ requestId: requestIdentity.requestId, outcome: z.literal('unknown'), error: z.string().min(1).max(500) }).strict(),
  z.object({ requestId: requestIdentity.requestId, outcome: z.literal('error'), error: z.string().min(1).max(500) }).strict()
]);
export type BrowserTxResultV2 = z.infer<typeof resultSchema>;

/** A callback reports submission or signing; it is not independent confirmation of execution. */
export function parseBrowserTxResult(input: unknown, request: BrowserTxRequestV2): BrowserTxResultV2 {
  const result = resultSchema.parse(input);
  if (result.requestId !== request.requestId) throw new Error('Browser result belongs to a different request');
  if (result.outcome === 'cancelled' || result.outcome === 'error' || result.outcome === 'unknown') return result;
  if (result.address !== request.expectedAddress || result.network !== request.network || result.chainId !== request.chainId || result.chain !== request.chain) throw new Error('Browser result does not match the requested signer or network');
  if ((result.outcome === 'signed') !== request.signOnly) throw new Error('Browser result does not match the requested signing mode');
  return result;
}
