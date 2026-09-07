import { getETHSignatureChallengeMessage } from './eth-signature-message.js';

const context = {
  chainId: 'bitbadges-1',
  nonce: 'nonce',
  initiatorAddress: 'initiator',
  collectionId: '1',
  approverAddress: '',
  approvalLevel: 'collection',
  approvalId: 'a-b',
  challengeId: 'c'
};

describe('v35 ETH signature challenge message', () => {
  it('matches the chain golden encoding', () => {
    expect(getETHSignatureChallengeMessage(context)).toBe(
      'BitBadges ETH Signature Challenge v2\n11:bitbadges-15:nonce9:initiator1:10:10:collection3:a-b1:c'
    );
  });
  it('separates ambiguous identifiers and chain IDs', () => {
    const message = getETHSignatureChallengeMessage(context);
    expect(getETHSignatureChallengeMessage({ ...context, approvalId: 'a', challengeId: 'b-c' })).not.toBe(message);
    expect(getETHSignatureChallengeMessage({ ...context, chainId: 'bitbadges-2' })).not.toBe(message);
  });
  it('rejects invalid nonce encodings', () => {
    for (const nonce of ['', 'a:b', 'a'.repeat(257), 'é']) expect(() => getETHSignatureChallengeMessage({ ...context, nonce })).toThrow();
  });
});
