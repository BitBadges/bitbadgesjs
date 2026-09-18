import { auctionsCommand } from './auctions.js';
import { buildAuction } from '../../core/builders/auction.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';
import { callIndexer } from '../utils/indexer-options.js';
import { runEmitOrDeploy } from '../utils/deploy-options.js';
jest.mock('../utils/indexer-options.js', () => ({
  ...jest.requireActual('../utils/indexer-options.js'),
  callIndexer: jest.fn(),
  emitIndexerError: (e: unknown) => {
    throw e;
  }
}));
jest.mock('../utils/deploy-options.js', () => ({ ...jest.requireActual('../utils/deploy-options.js'), runEmitOrDeploy: jest.fn() }));
const seller = convertToBitBadgesAddress('0x' + '1'.repeat(40));
const bidder = convertToBitBadgesAddress('0x' + '2'.repeat(40));
const collection = { ...buildAuction({ seller, uri: 'ipfs://auction' }).value, collectionId: '1' };
async function run() {
  await auctionsCommand.parseAsync(['accept-bid', '1', 'bid-id', '--creator', seller, '--bidder', bidder], { from: 'user' });
}
beforeEach(() => {
  jest.clearAllMocks();
  for (const a of collection.collectionApprovals) a.version = '7';
  (callIndexer as jest.Mock).mockImplementation(async (method, path) =>
    method === 'GET' ? collection : { balance: { incomingApprovals: [{ approvalId: 'bid-id', version: '5' }] } }
  );
});
it('uses the observed bidder incoming approval version, not zero', async () => {
  await run();
  const msg = (runEmitOrDeploy as jest.Mock).mock.calls[0][0];
  expect(msg.value.transfers[0].prioritizedApprovals).toEqual(
    expect.arrayContaining([expect.objectContaining({ approvalLevel: 'incoming', approvalId: 'bid-id', version: '5' })])
  );
});
it('refuses a removed bid instead of emitting a stale proposal', async () => {
  (callIndexer as jest.Mock).mockImplementation(async (method) => (method === 'GET' ? collection : { balance: { incomingApprovals: [] } }));
  await expect(run()).rejects.toThrow('bid');
  expect(runEmitOrDeploy).not.toHaveBeenCalled();
});
