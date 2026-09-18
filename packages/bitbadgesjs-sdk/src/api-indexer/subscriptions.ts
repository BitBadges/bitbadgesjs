export type SubscriptionOperatorConfig = { enabled: boolean; operator: string; escrowStoreId: string };

export type SubscriptionPeriodResponse = {
  periodId: string;
  tokenId: string;
  start: string;
  end: string;
  paidAmount: string;
};

export type SubscriptionQuoteRequest = {
  collectionId: string;
  kind: 'purchase' | 'upgrade';
  targetTokenId: string;
  requestId: string;
};

export type SubscriptionOfferSnapshot = {
  collectionId: string;
  operator: string;
  subscriber: string;
  initiator: string;
  approvalId: string;
  createdAt: string;
  expiresAt: string;
  targetTokenId: string;
  tierCount: string;
  ownershipTimes: { start: string; end: string }[];
  payments: { to: string; amount: string; denom: string }[];
  source?: { tokenId: string; escrow: string; ownershipTimes: { start: string; end: string }[] };
};

export type SubscriptionQuoteResponse = {
  quoteId: string;
  state: 'preparing' | 'ready' | 'submitted' | 'confirmed' | 'expired' | 'failed' | 'reconciling';
  kind: 'purchase' | 'upgrade';
  collectionId: string;
  subscriber: string;
  createdAt: string;
  expiresAt: string;
  denom: string;
  paymentAmount: string;
  periods: SubscriptionPeriodResponse[];
  offer: SubscriptionOfferSnapshot;
  versions?: { surrender: string; delivery: string; outgoing: string; intake?: string };
  transactionHash?: string;
  error?: string;
};

export function assertSubscriptionIdentifier(value: string): void {
  if (!/^[1-9]\d*$/.test(value) || BigInt(value) > 18446744073709551615n) throw new Error('Invalid subscription identifier.');
}

export function assertSubscriptionRequestId(value: string): void {
  if (typeof value !== 'string' || !value.trim() || value.length > 128) throw new Error('Invalid subscription request ID.');
}
