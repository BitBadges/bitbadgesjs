/**
 * Tests for build_transfer's autoCheck path (ticket #212).
 *
 * Mocks the indexer API client + the simulate helper so we can drive
 * `handleBuildTransfer` through its three autoCheck branches:
 *   1. autoCheck: false — pure construction, no sim call
 *   2. autoCheck: true with a single healthy approval — sim runs, result inlined
 *   3. autoCheck: true with the first approval exhausted — auto-fallback
 *      to the second approval candidate
 */

jest.mock('../../sdk/apiClient.js', () => ({
  getCollections: jest.fn()
}));
jest.mock('./simulateTransaction.js', () => ({
  simulateMessages: jest.fn()
}));

import { handleBuildTransfer } from './buildTransfer.js';
import { getCollections } from '../../sdk/apiClient.js';
import { simulateMessages } from './simulateTransaction.js';

const mockGetCollections = getCollections as jest.MockedFunction<typeof getCollections>;
const mockSimulate = simulateMessages as jest.MockedFunction<typeof simulateMessages>;

function mockCollectionWithApprovals(approvals: Array<Record<string, unknown>>) {
  mockGetCollections.mockResolvedValueOnce({
    success: true,
    data: {
      collections: [
        {
          collectionId: '123',
          validBadgeIds: [{ start: '1', end: '10' }],
          collectionApprovals: approvals,
          invariants: {}
        }
      ]
    }
  } as any);
}

const FROM = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
const TO = 'bb1pppppppppppppppppppppppppppppppppppppppppppppppppppppp';

describe('build_transfer autoCheck', () => {
  beforeEach(() => {
    mockGetCollections.mockReset();
    mockSimulate.mockReset();
  });

  it('autoCheck: false skips simulation entirely', async () => {
    mockCollectionWithApprovals([
      { approvalId: 'a-1', fromListId: 'All', toListId: 'All', approvalCriteria: {} }
    ]);

    const result = await handleBuildTransfer({
      collectionId: '123',
      fromAddress: FROM,
      toAddress: TO,
      amount: '1',
      autoCheck: false
    } as any);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.simulation).toBeUndefined();
    expect(mockSimulate).not.toHaveBeenCalled();
    expect(result.explanation?.approvalUsed).toBe('a-1');
  });

  it('autoCheck: true with a healthy approval inlines the simulation result', async () => {
    mockCollectionWithApprovals([
      { approvalId: 'a-1', fromListId: 'All', toListId: 'All', approvalCriteria: {} }
    ]);
    mockSimulate.mockResolvedValueOnce({
      success: true,
      valid: true,
      gasUsed: '321000',
      events: [],
      parsedEvents: {},
      netChanges: {}
    });

    const result = await handleBuildTransfer({
      collectionId: '123',
      fromAddress: FROM,
      toAddress: TO,
      amount: '1'
      // autoCheck defaults to true
    } as any);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.simulation).toBeDefined();
    expect(result.simulation?.valid).toBe(true);
    expect(result.simulation?.gasUsed).toBe('321000');
    expect(mockSimulate).toHaveBeenCalledTimes(1);
  });

  it('autoCheck: true falls back to the next approval when the first is exhausted', async () => {
    mockCollectionWithApprovals([
      { approvalId: 'exhausted-1', fromListId: 'All', toListId: 'All', approvalCriteria: {} },
      { approvalId: 'fresh-2', fromListId: 'All', toListId: 'All', approvalCriteria: {} }
    ]);

    // First sim: exhausted approval error
    mockSimulate.mockResolvedValueOnce({
      success: true,
      valid: false,
      simulationError: 'approval "exhausted-1" predeterminedBalances exhausted at block 1234567'
    });
    // Second sim (fallback): valid
    mockSimulate.mockResolvedValueOnce({
      success: true,
      valid: true,
      gasUsed: '400000'
    });

    const result = await handleBuildTransfer({
      collectionId: '123',
      fromAddress: FROM,
      toAddress: TO,
      amount: '1'
    } as any);

    expect(result.success).toBe(true);
    expect(result.simulation?.valid).toBe(true);
    // Should have landed on the second candidate
    expect(result.explanation?.approvalUsed).toBe('fresh-2');
    expect((result.simulation as any)?.fallbackUsed).toBe('fresh-2');
    expect(mockSimulate).toHaveBeenCalledTimes(2);
  });

  it('degrades gracefully when simulate itself fails (no API key etc.)', async () => {
    mockCollectionWithApprovals([
      { approvalId: 'a-1', fromListId: 'All', toListId: 'All', approvalCriteria: {} }
    ]);
    mockSimulate.mockResolvedValueOnce({
      success: false,
      error: 'BITBADGES_API_KEY not set'
    });

    const result = await handleBuildTransfer({
      collectionId: '123',
      fromAddress: FROM,
      toAddress: TO,
      amount: '1'
    } as any);

    // Still returns the transaction — never blocks the caller on sim transport failure
    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.simulation?.success).toBe(false);
    expect(result.simulation?.error).toMatch(/API_KEY/);
  });
});
