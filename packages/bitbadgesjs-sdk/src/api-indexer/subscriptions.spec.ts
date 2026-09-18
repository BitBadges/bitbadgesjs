import { BitBadgesAPI } from './BitBadgesApi.js';

const api = () => new BitBadgesAPI({ apiUrl: 'http://localhost:1234', convertFunction: String });

it('requests quotes without signing or broadcasting and preserves integer strings', async () => {
  const client = api();
  const result = { quoteId: 'quote-1', state: 'preparing', paymentAmount: '9007199254740993' };
  const post = jest.spyOn(client.axios, 'post').mockResolvedValue({ data: result });
  const payload = { collectionId: '1', kind: 'upgrade' as const, targetTokenId: '2', requestId: 'request-1' };
  expect(await client.createSubscriptionQuote(payload)).toEqual(result);
  expect(post).toHaveBeenCalledWith('http://localhost:1234/api/v0/subscriptions/quotes', payload);
});

it('fetches authenticated quote and period state without accepting a wallet override', async () => {
  const client = api();
  const get = jest.spyOn(client.axios, 'get').mockResolvedValue({ data: { periods: [] } });
  await client.getSubscriptionPeriods('123');
  expect(get).toHaveBeenLastCalledWith('http://localhost:1234/api/v0/subscriptions/periods', { params: { collectionId: '123' } });
  await client.getSubscriptionQuote('quote/id');
  expect(get).toHaveBeenLastCalledWith('http://localhost:1234/api/v0/subscriptions/quotes/quote%2Fid');
});

it('reports a transaction hash as a reconciliation hint only', async () => {
  const client = api();
  const post = jest.spyOn(client.axios, 'post').mockResolvedValue({ data: { state: 'submitted' } });
  await client.submitSubscriptionQuote('quote-1', 'a'.repeat(64));
  expect(post).toHaveBeenCalledWith('http://localhost:1234/api/v0/subscriptions/quotes/quote-1/submission', { txHash: 'a'.repeat(64) });
});

it('rejects malformed identifiers before a network request', async () => {
  const client = api();
  const post = jest.spyOn(client.axios, 'post');
  for (const collectionId of ['0', '-1', '1/other', '1.5', '18446744073709551616']) {
    await expect(client.createSubscriptionQuote({ collectionId, kind: 'purchase', targetTokenId: '1', requestId: 'r' })).rejects.toThrow();
  }
  await expect(client.submitSubscriptionQuote('q', 'not-a-hash')).rejects.toThrow();
  expect(post).not.toHaveBeenCalled();
});
