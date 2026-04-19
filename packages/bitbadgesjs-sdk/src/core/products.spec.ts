/**
 * Tests for products.ts — Product catalog protocol validator.
 *
 * Covers:
 *   - validateProductCatalogCollection
 *   - doesCollectionFollowProductCatalogProtocol
 *   - doesCollectionFollowProductProtocol (legacy)
 *   - isProductApproval
 *
 * A valid Products catalog:
 *   - has the "Products" standard
 *   - has validTokenIds starting at 1n
 *   - has >= 1 purchase approval (fromListId="Mint") with one coinTransfer,
 *     a predetermined start amount of 1, non-null maxNumTransfers, no
 *     challenges, a single-token range, and none of the override-initiator
 *     flags set on coinTransfers
 *   - optional burn approvals must not carry coinTransfers
 */

import {
  validateProductCatalogCollection,
  doesCollectionFollowProductCatalogProtocol,
  doesCollectionFollowProductProtocol,
  isProductApproval
} from './products.js';

const BURN = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

// ---- fixture helpers ------------------------------------------------------

const makePurchaseApproval = (tokenId: bigint = 1n) =>
  ({
    approvalId: `purchase-${tokenId}`,
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: 1n, end: 1000n }],
    tokenIds: [{ start: tokenId, end: tokenId }],
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      maxNumTransfers: { overallMaxNumTransfers: 100n },
      coinTransfers: [
        {
          to: 'bb1seller',
          coins: [{ denom: 'ubadge', amount: 1000n }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      predeterminedBalances: {
        incrementedBalances: {
          startBalances: [
            {
              amount: 1n,
              tokenIds: [{ start: tokenId, end: tokenId }],
              ownershipTimes: [{ start: 1n, end: 10000n }]
            }
          ],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowAmountScaling: false,
          recurringOwnershipTimes: {
            startTime: 0n,
            intervalLength: 0n,
            chargePeriodLength: 0n
          }
        }
      },
      merkleChallenges: []
    }
  }) as any;

const makeBurnApproval = () =>
  ({
    approvalId: 'burn',
    fromListId: '!Mint',
    toListId: BURN,
    initiatedByListId: 'All',
    transferTimes: [{ start: 1n, end: 1000n }],
    tokenIds: [{ start: 1n, end: 1n }],
    approvalCriteria: {
      maxNumTransfers: { overallMaxNumTransfers: 100n }
    }
  }) as any;

const makeValidCollection = (): any => ({
  standards: ['Products'],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: [makePurchaseApproval(1n)],
  invariants: { noCustomOwnershipTimes: true }
});

// ===========================================================================
// validateProductCatalogCollection — happy path
// ===========================================================================

describe('validateProductCatalogCollection — happy path', () => {
  it('accepts a minimal valid single-product catalog', () => {
    const r = validateProductCatalogCollection(makeValidCollection());
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.details?.productCount).toBe(1);
    expect(r.details?.hasBurnApproval).toBe(false);
  });

  it('accepts a multi-product catalog (validTokenIds [1,3])', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 3n }];
    c.collectionApprovals = [
      makePurchaseApproval(1n),
      makePurchaseApproval(2n),
      makePurchaseApproval(3n)
    ];
    const r = validateProductCatalogCollection(c);
    expect(r.valid).toBe(true);
    expect(r.details?.productCount).toBe(3);
  });

  it('accepts a catalog with an optional burn approval', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makePurchaseApproval(1n), makeBurnApproval()];
    const r = validateProductCatalogCollection(c);
    expect(r.valid).toBe(true);
    expect(r.details?.hasBurnApproval).toBe(true);
  });

  it('accepts purchase approval with toListId = burn address', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].toListId = BURN;
    const r = validateProductCatalogCollection(c);
    expect(r.valid).toBe(true);
  });

  it('accepts multi-standard including Products', () => {
    const c = makeValidCollection();
    c.standards = ['Auction', 'Products', 'Other'];
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });

  it('doesCollectionFollowProductCatalogProtocol returns true for valid catalog', () => {
    expect(doesCollectionFollowProductCatalogProtocol(makeValidCollection())).toBe(true);
  });
});

// ===========================================================================
// standards check
// ===========================================================================

describe('validateProductCatalogCollection — standards check', () => {
  it('rejects when "Products" standard is missing', () => {
    const c = makeValidCollection();
    c.standards = ['Other'];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Missing "Products" standard');
    expect(r.valid).toBe(false);
  });

  it('rejects when standards is empty', () => {
    const c = makeValidCollection();
    c.standards = [];
    expect(validateProductCatalogCollection(c).errors).toContain('Missing "Products" standard');
  });

  it('rejects when standards is undefined', () => {
    const c = makeValidCollection();
    c.standards = undefined;
    expect(validateProductCatalogCollection(c).errors).toContain('Missing "Products" standard');
  });
});

// ===========================================================================
// validTokenIds check
// ===========================================================================

describe('validateProductCatalogCollection — validTokenIds', () => {
  it('rejects when validTokenIds does not start at 1', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 2n, end: 2n }];
    c.collectionApprovals = [makePurchaseApproval(2n)];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('validTokenIds must start at 1');
  });

  it('rejects empty validTokenIds', () => {
    const c = makeValidCollection();
    c.validTokenIds = [];
    expect(validateProductCatalogCollection(c).errors).toContain('validTokenIds must start at 1');
  });

  it('accepts multi-range validTokenIds starting at 1', () => {
    const c = makeValidCollection();
    c.validTokenIds = [
      { start: 1n, end: 1n },
      { start: 5n, end: 5n }
    ];
    c.collectionApprovals = [makePurchaseApproval(1n), makePurchaseApproval(5n)];
    const r = validateProductCatalogCollection(c);
    expect(r.valid).toBe(true);
  });

  it('merges sortable ranges before checking start', () => {
    // [5,5] + [1,1] should sort to [1,1] first — still valid
    const c = makeValidCollection();
    c.validTokenIds = [
      { start: 5n, end: 5n },
      { start: 1n, end: 1n }
    ];
    c.collectionApprovals = [makePurchaseApproval(1n), makePurchaseApproval(5n)];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).not.toContain('validTokenIds must start at 1');
  });
});

// ===========================================================================
// invariants warning
// ===========================================================================

describe('validateProductCatalogCollection — invariants', () => {
  it('warns when invariants.noCustomOwnershipTimes is false', () => {
    const c = makeValidCollection();
    c.invariants = { noCustomOwnershipTimes: false };
    const r = validateProductCatalogCollection(c);
    expect(r.warnings).toContain('invariants.noCustomOwnershipTimes should be true for product catalogs');
    // Warnings do not invalidate.
    expect(r.valid).toBe(true);
  });

  it('does not warn when invariants is undefined (treated as absent)', () => {
    const c = makeValidCollection();
    delete c.invariants;
    const r = validateProductCatalogCollection(c);
    expect(r.warnings).toEqual([]);
  });

  it('does not warn when invariants.noCustomOwnershipTimes is true', () => {
    const c = makeValidCollection();
    c.invariants = { noCustomOwnershipTimes: true };
    const r = validateProductCatalogCollection(c);
    expect(r.warnings).toEqual([]);
  });
});

// ===========================================================================
// missing purchase approvals
// ===========================================================================

describe('validateProductCatalogCollection — purchase approvals required', () => {
  it('rejects when there are zero purchase approvals', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makeBurnApproval()];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('No purchase approvals found (fromListId="Mint")');
    expect(r.valid).toBe(false);
  });

  it('rejects when collectionApprovals is empty', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('No purchase approvals found (fromListId="Mint")');
  });
});

// ===========================================================================
// purchase approval — toListId
// ===========================================================================

describe('validateProductCatalogCollection — purchase.toListId', () => {
  it('rejects toListId != "All" and != BURN', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].toListId = 'bb1other';
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: toListId must be "All" or burn address');
  });

  it('accepts toListId = "All"', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].toListId = 'All';
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });

  it('accepts toListId = burn address', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].toListId = BURN;
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });
});

// ===========================================================================
// purchase approval — initiatedByListId
// ===========================================================================

describe('validateProductCatalogCollection — purchase.initiatedByListId', () => {
  it('rejects initiatedByListId != "All"', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].initiatedByListId = 'bb1buyer';
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: initiatedByListId must be "All"');
  });
});

// ===========================================================================
// purchase approval — override flags
// ===========================================================================

describe('validateProductCatalogCollection — override flags', () => {
  it('rejects overridesFromOutgoingApprovals = false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.overridesFromOutgoingApprovals = false;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: overridesFromOutgoingApprovals must be true');
  });

  it('rejects overridesFromOutgoingApprovals undefined', () => {
    const c = makeValidCollection();
    delete c.collectionApprovals[0].approvalCriteria.overridesFromOutgoingApprovals;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: overridesFromOutgoingApprovals must be true');
  });

  it('rejects overridesToIncomingApprovals = false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.overridesToIncomingApprovals = false;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: overridesToIncomingApprovals must be true');
  });

  it('rejects when approvalCriteria is missing entirely', () => {
    const c = makeValidCollection();
    delete c.collectionApprovals[0].approvalCriteria;
    const r = validateProductCatalogCollection(c);
    // With criteria gone, both override flags and other checks fire.
    expect(r.errors).toContain('Purchase approval #1: overridesFromOutgoingApprovals must be true');
    expect(r.errors).toContain('Purchase approval #1: overridesToIncomingApprovals must be true');
    expect(r.valid).toBe(false);
  });
});

// ===========================================================================
// purchase approval — tokenIds target exactly 1 token
// ===========================================================================

describe('validateProductCatalogCollection — purchase.tokenIds', () => {
  it('rejects tokenId range size > 1', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].tokenIds = [{ start: 1n, end: 2n }];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: tokenIds must target exactly 1 token (start=end)');
  });

  it('rejects multiple tokenId ranges', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].tokenIds = [
      { start: 1n, end: 1n },
      { start: 3n, end: 3n }
    ];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: tokenIds must target exactly 1 token (start=end)');
  });

  it('rejects empty tokenIds', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].tokenIds = [];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: tokenIds must target exactly 1 token (start=end)');
  });
});

// ===========================================================================
// purchase approval — coinTransfers
// ===========================================================================

describe('validateProductCatalogCollection — purchase.coinTransfers', () => {
  it('rejects missing coinTransfers', () => {
    const c = makeValidCollection();
    delete c.collectionApprovals[0].approvalCriteria.coinTransfers;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have exactly 1 coinTransfer');
  });

  it('rejects 0 coinTransfers', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers = [];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have exactly 1 coinTransfer');
  });

  it('rejects >1 coinTransfers', () => {
    const c = makeValidCollection();
    const existing = c.collectionApprovals[0].approvalCriteria.coinTransfers[0];
    c.collectionApprovals[0].approvalCriteria.coinTransfers = [existing, { ...existing }];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have exactly 1 coinTransfer');
  });

  it('rejects coinTransfer with 0 coins', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins = [];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: coinTransfer must have exactly 1 coin');
  });

  it('rejects coinTransfer with 2 coins', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins = [
      { denom: 'ubadge', amount: 100n },
      { denom: 'uusdc', amount: 100n }
    ];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: coinTransfer must have exactly 1 coin');
  });

  it('rejects coinTransfer amount = 0', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = 0n;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: coinTransfer amount must be > 0');
  });

  it('rejects coinTransfer amount < 0', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = -5n;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: coinTransfer amount must be > 0');
  });

  it('rejects overrideFromWithApproverAddress=true', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = true;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain(
      'Purchase approval #1: coinTransfer must NOT use overrideFromWithApproverAddress'
    );
  });

  it('rejects overrideToWithInitiator=true', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].overrideToWithInitiator = true;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain(
      'Purchase approval #1: coinTransfer must NOT use overrideToWithInitiator'
    );
  });

  it('accepts amount=1 (smallest positive)', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = 1n;
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });

  it('accepts a non-ubadge denom (denom is not policed here)', () => {
    // validateProductCatalogCollection does NOT check denom — that's isProductApproval's job.
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].denom = 'uusdc';
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });
});

// ===========================================================================
// purchase approval — predeterminedBalances
// ===========================================================================

describe('validateProductCatalogCollection — predeterminedBalances', () => {
  it('rejects missing predeterminedBalances entirely', () => {
    const c = makeValidCollection();
    delete c.collectionApprovals[0].approvalCriteria.predeterminedBalances;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have predeterminedBalances.incrementedBalances');
  });

  it('rejects missing incrementedBalances', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.predeterminedBalances = {} as any;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have predeterminedBalances.incrementedBalances');
  });

  it('rejects startBalances with 0 entries', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: predeterminedBalances startBalances amount must be 1');
  });

  it('rejects startBalances with 2 entries', () => {
    const c = makeValidCollection();
    const existing =
      c.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0];
    c.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [
      existing,
      { ...existing }
    ];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: predeterminedBalances startBalances amount must be 1');
  });

  it('rejects startBalances amount != 1n', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: predeterminedBalances startBalances amount must be 1');
  });
});

// ===========================================================================
// purchase approval — maxNumTransfers
// ===========================================================================

describe('validateProductCatalogCollection — maxNumTransfers', () => {
  it('rejects missing maxNumTransfers', () => {
    const c = makeValidCollection();
    delete c.collectionApprovals[0].approvalCriteria.maxNumTransfers;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have maxNumTransfers set');
  });

  it('rejects maxNumTransfers null', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers = null;
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must have maxNumTransfers set');
  });

  it('accepts any non-null maxNumTransfers (the validator only checks presence)', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.maxNumTransfers = {};
    // Absence check is truthy — empty object is accepted by this layer.
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });
});

// ===========================================================================
// purchase approval — challenges prohibited
// ===========================================================================

describe('validateProductCatalogCollection — challenges must be absent', () => {
  it('rejects merkleChallenges present', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.merkleChallenges = [{ challengeTrackerId: 'foo' }];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must NOT have merkleChallenges');
  });

  it('accepts empty merkleChallenges array', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.merkleChallenges = [];
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });

  it('rejects votingChallenges present', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.votingChallenges = [{ id: 'v1' }];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must NOT have votingChallenges');
  });

  it('rejects dynamicStoreChallenges present', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.dynamicStoreChallenges = [{ id: 'd1' }];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #1: must NOT have dynamicStoreChallenges');
  });
});

// ===========================================================================
// burn approval validation
// ===========================================================================

describe('validateProductCatalogCollection — burn approval rules', () => {
  it('rejects burn approval with coinTransfers attached', () => {
    const c = makeValidCollection();
    const burn = makeBurnApproval();
    burn.approvalCriteria.coinTransfers = [
      {
        to: 'bb1recipient',
        coins: [{ denom: 'ubadge', amount: 1n }],
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false
      }
    ];
    c.collectionApprovals = [makePurchaseApproval(1n), burn];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Burn approval #1: burn approval must NOT have coinTransfers');
    expect(r.valid).toBe(false);
  });

  it('accepts burn approval with empty coinTransfers array', () => {
    const c = makeValidCollection();
    const burn = makeBurnApproval();
    burn.approvalCriteria.coinTransfers = [];
    c.collectionApprovals = [makePurchaseApproval(1n), burn];
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });

  it('accepts burn approval without any coinTransfers (undefined)', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makePurchaseApproval(1n), makeBurnApproval()];
    expect(validateProductCatalogCollection(c).valid).toBe(true);
  });

  it('reports every bad burn approval — prefix increments', () => {
    const c = makeValidCollection();
    const burn1 = makeBurnApproval();
    burn1.approvalId = 'burn-1';
    burn1.approvalCriteria.coinTransfers = [
      {
        to: 'bb1x',
        coins: [{ denom: 'ubadge', amount: 1n }],
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false
      }
    ];
    const burn2 = makeBurnApproval();
    burn2.approvalId = 'burn-2';
    burn2.approvalCriteria.coinTransfers = [
      {
        to: 'bb1y',
        coins: [{ denom: 'ubadge', amount: 1n }],
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false
      }
    ];
    c.collectionApprovals = [makePurchaseApproval(1n), burn1, burn2];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Burn approval #1: burn approval must NOT have coinTransfers');
    expect(r.errors).toContain('Burn approval #2: burn approval must NOT have coinTransfers');
  });
});

// ===========================================================================
// multi-error aggregation
// ===========================================================================

describe('validateProductCatalogCollection — multi-error aggregation', () => {
  it('reports multiple independent issues in one pass', () => {
    const c = makeValidCollection();
    c.standards = ['Other'];
    c.collectionApprovals[0].initiatedByListId = 'bb1buyer';
    c.collectionApprovals[0].approvalCriteria.merkleChallenges = [{ id: 'x' }];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Missing "Products" standard');
    expect(r.errors).toContain('Purchase approval #1: initiatedByListId must be "All"');
    expect(r.errors).toContain('Purchase approval #1: must NOT have merkleChallenges');
    expect(r.valid).toBe(false);
  });

  it('uses 1-based indexing across multiple purchase approvals', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 2n }];
    const p1 = makePurchaseApproval(1n);
    const p2 = makePurchaseApproval(2n);
    p2.initiatedByListId = 'bb1buyer';
    c.collectionApprovals = [p1, p2];
    const r = validateProductCatalogCollection(c);
    expect(r.errors).toContain('Purchase approval #2: initiatedByListId must be "All"');
    expect(r.errors).not.toContain('Purchase approval #1: initiatedByListId must be "All"');
  });

  it('details.productCount counts only fromListId="Mint" approvals', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [
      makePurchaseApproval(1n),
      makeBurnApproval(),
      makePurchaseApproval(1n)
    ];
    const r = validateProductCatalogCollection(c);
    expect(r.details?.productCount).toBe(2);
    expect(r.details?.hasBurnApproval).toBe(true);
  });
});

// ===========================================================================
// doesCollectionFollowProductCatalogProtocol — wrapper
// ===========================================================================

describe('doesCollectionFollowProductCatalogProtocol', () => {
  it('returns true when valid', () => {
    expect(doesCollectionFollowProductCatalogProtocol(makeValidCollection())).toBe(true);
  });

  it('returns false when invalid', () => {
    const c = makeValidCollection();
    c.standards = ['Other'];
    expect(doesCollectionFollowProductCatalogProtocol(c)).toBe(false);
  });

  it('returns false when collection is undefined', () => {
    expect(doesCollectionFollowProductCatalogProtocol(undefined)).toBe(false);
  });
});

// ===========================================================================
// doesCollectionFollowProductProtocol (legacy, single-product only)
// ===========================================================================

describe('doesCollectionFollowProductProtocol (legacy)', () => {
  it('returns false for undefined collection', () => {
    expect(doesCollectionFollowProductProtocol(undefined)).toBe(false);
  });

  it('returns true for validTokenIds [1,1] + Products standard', () => {
    const c = makeValidCollection();
    expect(doesCollectionFollowProductProtocol(c)).toBe(true);
  });

  it('returns false when Products standard is missing', () => {
    const c = makeValidCollection();
    c.standards = ['Subscriptions'];
    expect(doesCollectionFollowProductProtocol(c)).toBe(false);
  });

  it('returns false when validTokenIds range is >1 token', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 2n }];
    expect(doesCollectionFollowProductProtocol(c)).toBe(false);
  });

  it('returns false when validTokenIds has multiple ranges', () => {
    const c = makeValidCollection();
    c.validTokenIds = [
      { start: 1n, end: 1n },
      { start: 2n, end: 2n }
    ];
    expect(doesCollectionFollowProductProtocol(c)).toBe(false);
  });

  it('returns false when validTokenIds does not start at 1 (start=2,end=2)', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 2n, end: 2n }];
    expect(doesCollectionFollowProductProtocol(c)).toBe(false);
  });

  it('returns false when validTokenIds does not end at 1 (start=1,end=1 is merged from multiple)', () => {
    // [1,1] after sort+merge is still [1,1] — this must return true.
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 1n }];
    expect(doesCollectionFollowProductProtocol(c)).toBe(true);
  });
});

// ===========================================================================
// isProductApproval — helper function tests
// ===========================================================================

describe('isProductApproval', () => {
  const makeValidProductApproval = () =>
    ({
      approvalId: 'product',
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 1000n }],
      tokenIds: [{ start: 1n, end: 1n }],
      approvalCriteria: {
        coinTransfers: [
          {
            to: 'bb1seller',
            coins: [{ denom: 'ubadge', amount: 1000n }],
            overrideFromWithApproverAddress: false,
            overrideToWithInitiator: false
          }
        ],
        predeterminedBalances: {
          incrementedBalances: {
            startBalances: [
              {
                amount: 1n,
                tokenIds: [{ start: 1n, end: 1n }],
                ownershipTimes: [{ start: 1n, end: 10000n }]
              }
            ],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowAmountScaling: false,
            recurringOwnershipTimes: {
              startTime: 0n,
              intervalLength: 0n,
              chargePeriodLength: 0n
            }
          }
        },
        merkleChallenges: [],
        mustOwnTokens: [],
        requireToEqualsInitiatedBy: false,
        maxNumTransfers: { overallMaxNumTransfers: 1n }
      }
    }) as any;

  it('returns true for a valid product approval', () => {
    expect(isProductApproval(makeValidProductApproval())).toBe(true);
  });

  it('returns false when coinTransfers is missing from approvalCriteria', () => {
    const a = makeValidProductApproval();
    delete a.approvalCriteria.coinTransfers;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when fromListId is not "Mint"', () => {
    const a = makeValidProductApproval();
    a.fromListId = 'bb1other';
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when a merkle challenge has maxUsesPerLeaf != 1', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.merkleChallenges = [
      { maxUsesPerLeaf: 2n, useCreatorAddressAsLeaf: false }
    ];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when a merkle challenge uses creatorAddress as leaf', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.merkleChallenges = [
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: true }
    ];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns true with one acceptable merkle challenge (maxUsesPerLeaf=1, useCreator=false)', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.merkleChallenges = [
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }
    ];
    expect(isProductApproval(a)).toBe(true);
  });

  it('returns false with >1 coinTransfers', () => {
    const a = makeValidProductApproval();
    const ct = a.approvalCriteria.coinTransfers[0];
    a.approvalCriteria.coinTransfers = [ct, { ...ct }];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false with 0 coinTransfers', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.coinTransfers = [];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when coin denom is not "ubadge"', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.coinTransfers[0].coins[0].denom = 'uusdc';
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when coinTransfer has 2 coins', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.coinTransfers[0].coins = [
      { denom: 'ubadge', amount: 100n },
      { denom: 'ubadge', amount: 100n }
    ];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when overrideFromWithApproverAddress is true', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = true;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when overrideToWithInitiator is true', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.coinTransfers[0].overrideToWithInitiator = true;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when incrementedBalances is missing', () => {
    const a = makeValidProductApproval();
    delete a.approvalCriteria.predeterminedBalances;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when allowAmountScaling is true', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = true;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when startBalances length != 1', () => {
    const a = makeValidProductApproval();
    const sb = a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0];
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [sb, { ...sb }];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when startBalances tokenIds is not [1,1]', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 2n, end: 2n }
    ];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when startBalances tokenIds size > 1', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 1n, end: 2n }
    ];
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when startBalances amount != 1', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when incrementTokenIdsBy != 0', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when incrementOwnershipTimesBy != 0', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy = 1n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when durationFromTimestamp != 0', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 1n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when allowOverrideTimestamp is true', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp = true;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.startTime != 0', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.startTime = 10n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.intervalLength != 0', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength = 10n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.chargePeriodLength != 0', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength = 10n;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when requireToEqualsInitiatedBy is true', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.requireToEqualsInitiatedBy = true;
    expect(isProductApproval(a)).toBe(false);
  });

  it('returns false when mustOwnTokens is non-empty', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.mustOwnTokens = [
      { collectionId: 1n, tokenIds: [{ start: 1n, end: 1n }] }
    ];
    expect(isProductApproval(a)).toBe(false);
  });

  it('accepts mustOwnTokens explicitly empty', () => {
    const a = makeValidProductApproval();
    a.approvalCriteria.mustOwnTokens = [];
    expect(isProductApproval(a)).toBe(true);
  });
});
