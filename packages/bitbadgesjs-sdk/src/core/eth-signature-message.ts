export type ETHSignatureChallengeMessageContext = {
  chainId: string;
  nonce: string;
  initiatorAddress: string;
  collectionId: string;
  approverAddress: string;
  approvalLevel: string;
  approvalId: string;
  challengeId: string;
};

/** v35+ voucher message to pass to an Ethereum wallet's signMessage method. */
export function getETHSignatureChallengeMessage(context: ETHSignatureChallengeMessageContext): string {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(context.nonce)) {
    throw new Error('Nonce must contain 1–256 ASCII letters, digits, hyphens or underscores.');
  }
  const fields = [
    context.chainId,
    context.nonce,
    context.initiatorAddress,
    context.collectionId,
    context.approverAddress,
    context.approvalLevel,
    context.approvalId,
    context.challengeId
  ];
  const encoder = new TextEncoder();
  return 'BitBadges ETH Signature Challenge v2\n' + fields.map((field) => `${encoder.encode(field).length}:${field}`).join('');
}
