import { prepareBrowserReviewRequest } from './browser-review.js';
import { artifactIdentity, verifyIntent } from '../../core/intent.js';
import { NETWORK_CONFIGS } from '../../signing/types.js';
const address = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
const artifact = { messages: [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { fromAddress: address, toAddress: address, amount: [{ denom: 'ubadge', amount: '1' }] } }] };
const intent = { version: 1, requirements: [], unresolvedDecisions: [] };
const review = { version: 1, artifactId: artifactIdentity(artifact), intent, evidence: verifyIntent(artifact, intent), binding: { expectedAddress: address, network: 'local', chainId: NETWORK_CONFIGS.local.cosmosChainId } };
describe('browser request review binding', () => {
  it('keeps existing v2 request identity and includes only matching review context', () => {
    const request = prepareBrowserReviewRequest({ artifact, expectedAddress: address, network: 'local', review });
    expect(request.version).toBe(2); expect(request.requestId).toMatch(/^[a-f0-9]{32}$/);
    expect(request.review?.artifactId).toBe(artifactIdentity(artifact));
  });
  it('rejects stale evidence, changed artifact and changed network', () => {
    expect(() => prepareBrowserReviewRequest({ artifact, expectedAddress: address, network: 'local', review: { ...review, evidence: { ...review.evidence, intentId: 'f'.repeat(64) } } })).toThrow(/evidence/);
    expect(() => prepareBrowserReviewRequest({ artifact: { messages: [...artifact.messages, ...artifact.messages] }, expectedAddress: address, network: 'local', review })).toThrow(/stale/);
    expect(() => prepareBrowserReviewRequest({ artifact, expectedAddress: address, network: 'testnet', review })).toThrow(/stale/);
  });
});
