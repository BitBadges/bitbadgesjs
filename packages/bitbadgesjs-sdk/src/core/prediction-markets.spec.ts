import {
  getDepositDenom,
  isPredictionMarketIntentApproval,
  validatePredictionMarketCollection,
  isPredictionMarketValid
} from './prediction-markets.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const MAX_UINT64 = '18446744073709551615';

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const frozenPerm = () => [
  { permanentlyForbiddenTimes: [{ start: '1', end: MAX_UINT64 }] }
];

const range = (start: string, end: string) => [{ start, end }];

const makeMintApproval = (denom = 'ubadge', amount = '1000000') => ({
  fromListId: 'Mint',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: range('1', MAX_UINT64),
  tokenIds: range('1', '2'),
  approvalCriteria: {
    coinTransfers: [
      {
        to: 'Mint',
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false,
        coins: [{ denom, amount }]
      }
    ],
    predeterminedBalances: {
      incrementedBalances: {
        startBalances: [
          { tokenIds: range('1', '1'), amount: '1000000' },
          { tokenIds: range('2', '2'), amount: '1000000' }
        ]
      },
      orderCalculationMethod: { useOverallNumTransfers: true }
    },
    maxNumTransfers: { overallMaxNumTransfers: '0' }
  }
});

const makeRedeemApproval = (denom = 'ubadge', amount = '1000000') => ({
  fromListId: '!Mint',
  toListId: BURN_ADDRESS,
  initiatedByListId: 'All',
  transferTimes: range('1', MAX_UINT64),
  tokenIds: range('1', '2'),
  approvalCriteria: {
    coinTransfers: [
      {
        overrideFromWithApproverAddress: true,
        overrideToWithInitiator: true,
        coins: [{ denom, amount }]
      }
    ],
    predeterminedBalances: {
      incrementedBalances: {
        startBalances: [
          { tokenIds: range('1', '1'), amount: '1000000' },
          { tokenIds: range('2', '2'), amount: '1000000' }
        ]
      },
      orderCalculationMethod: { useOverallNumTransfers: true }
    },
    maxNumTransfers: { overallMaxNumTransfers: '1000' }
  }
});

const makeWinsApproval = (tokenId: string, denom = 'ubadge', amount = '1000000', push = false) => {
  // push: coinAmount = amount/2, startBalance = amount
  const startBal = push ? (BigInt(amount) * 2n).toString() : '1000000';
  const coinAmt = push ? (BigInt(startBal) / 2n).toString() : amount;
  return {
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: range('1', MAX_UINT64),
    tokenIds: range(tokenId, tokenId),
    approvalCriteria: {
      coinTransfers: [
        {
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ denom, amount: coinAmt }]
        }
      ],
      predeterminedBalances: {
        incrementedBalances: {
          startBalances: [{ tokenIds: range(tokenId, tokenId), amount: startBal }]
        },
        orderCalculationMethod: { useOverallNumTransfers: true }
      },
      maxNumTransfers: { overallMaxNumTransfers: '1000' },
      votingChallenges: [{ voters: [{ address: 'bb1verifier' }] }]
    }
  };
};

const makeTransferableApproval = () => ({
  fromListId: 'All',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: range('1', MAX_UINT64),
  tokenIds: range('1', '2'),
  approvalCriteria: {}
});

const makeValidCollection = () => ({
  standards: ['Prediction Market'],
  validTokenIds: range('1', '2'),
  invariants: { disablePoolCreation: false },
  aliasPaths: [
    {
      denom: 'uyes',
      denomUnits: [{ decimals: '6' }],
      conversion: { sideB: [{ tokenIds: range('1', '1') }] }
    },
    {
      denom: 'uno',
      denomUnits: [{ decimals: '6' }],
      conversion: { sideB: [{ tokenIds: range('2', '2') }] }
    }
  ],
  collectionPermissions: {
    canDeleteCollection: frozenPerm(),
    canArchiveCollection: frozenPerm(),
    canUpdateStandards: frozenPerm(),
    canUpdateCustomData: frozenPerm(),
    canUpdateManager: frozenPerm(),
    canUpdateCollectionMetadata: frozenPerm(),
    canAddMoreAliasPaths: frozenPerm(),
    canAddMoreCosmosCoinWrapperPaths: frozenPerm(),
    canUpdateValidTokenIds: frozenPerm(),
    canUpdateTokenMetadata: frozenPerm(),
    canUpdateCollectionApprovals: frozenPerm()
  },
  collectionApprovals: [
    makeMintApproval(),
    makeRedeemApproval(),
    makeWinsApproval('1', 'ubadge', '1000000', false),
    makeWinsApproval('2', 'ubadge', '1000000', false),
    makeWinsApproval('1', 'ubadge', '1000000', true),
    makeWinsApproval('2', 'ubadge', '1000000', true),
    makeTransferableApproval()
  ]
});

// ---------------------------------------------------------------------------
// getDepositDenom
// ---------------------------------------------------------------------------

describe('getDepositDenom', () => {
  it('returns denom from the Mint approval', () => {
    const col = makeValidCollection();
    expect(getDepositDenom(col)).toBe('ubadge');
  });

  it('returns undefined when no Mint approval exists', () => {
    const col = { collectionApprovals: [makeRedeemApproval()] };
    expect(getDepositDenom(col)).toBeUndefined();
  });

  it('returns undefined when collection is null/undefined', () => {
    expect(getDepositDenom(null)).toBeUndefined();
    expect(getDepositDenom(undefined)).toBeUndefined();
  });

  it('returns undefined when collectionApprovals is missing', () => {
    expect(getDepositDenom({})).toBeUndefined();
  });

  it('handles IBC denoms', () => {
    const col = { collectionApprovals: [makeMintApproval('ibc/F082B65C88E4B6D5EF1DB243CDA1D331BB5F761', '1000000')] };
    expect(getDepositDenom(col)).toBe('ibc/F082B65C88E4B6D5EF1DB243CDA1D331BB5F761');
  });

  it('returns undefined when coinTransfers is empty', () => {
    const mint = makeMintApproval();
    mint.approvalCriteria.coinTransfers = [];
    expect(getDepositDenom({ collectionApprovals: [mint] })).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isPredictionMarketIntentApproval
// ---------------------------------------------------------------------------

describe('isPredictionMarketIntentApproval', () => {
  const baseIntent: any = {
    initiatedByListId: 'All',
    transferTimes: [{ start: 1n, end: 1000n }],
    tokenIds: [{ start: 1n, end: 1n }],
    approvalCriteria: {
      coinTransfers: [{ coins: [{ amount: 500000n, denom: 'ubadge' }] }],
      predeterminedBalances: {
        incrementedBalances: {
          startBalances: [{ amount: 1000000n, tokenIds: [{ start: 1n, end: 1n }] }]
        },
        orderCalculationMethod: { useOverallNumTransfers: true }
      },
      maxNumTransfers: { overallMaxNumTransfers: 1n }
    }
  };

  const clone = (obj: any) => JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));

  it('accepts a valid YES intent approval', () => {
    expect(isPredictionMarketIntentApproval(baseIntent)).toBe(true);
  });

  it('accepts a valid NO intent approval (token id 2)', () => {
    const a = clone(baseIntent);
    a.tokenIds = [{ start: '2', end: '2' }];
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [{ start: '2', end: '2' }];
    expect(isPredictionMarketIntentApproval(a)).toBe(true);
  });

  it('rejects when initiatedByListId is not "All"', () => {
    const a = clone(baseIntent);
    a.initiatedByListId = 'someone';
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when there are multiple transfer time windows', () => {
    const a = clone(baseIntent);
    a.transferTimes = [
      { start: '1', end: '500' },
      { start: '600', end: '1000' }
    ];
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when coinTransfers count is not exactly 1', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.coinTransfers = [];
    expect(isPredictionMarketIntentApproval(a)).toBe(false);

    const b = clone(baseIntent);
    b.approvalCriteria.coinTransfers = [
      { coins: [{ amount: '100', denom: 'ubadge' }] },
      { coins: [{ amount: '100', denom: 'ubadge' }] }
    ];
    expect(isPredictionMarketIntentApproval(b)).toBe(false);
  });

  it('rejects when coin amount is zero', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.coinTransfers[0].coins[0].amount = '0';
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects same-collection badgeslp: denoms', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.coinTransfers[0].coins[0].denom = 'badgeslp:123';
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when predeterminedBalances is missing', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.predeterminedBalances = undefined;
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when startBalances are empty', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [];
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when start balance amount is zero', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = '0';
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when useOverallNumTransfers is false/missing', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.predeterminedBalances.orderCalculationMethod = { useOverallNumTransfers: false };
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when tokenIds span more than one id', () => {
    const a = clone(baseIntent);
    a.tokenIds = [{ start: '1', end: '2' }];
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when tokenIds length is not 1', () => {
    const a = clone(baseIntent);
    a.tokenIds = [
      { start: '1', end: '1' },
      { start: '2', end: '2' }
    ];
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects token ids other than 1 or 2', () => {
    const a = clone(baseIntent);
    a.tokenIds = [{ start: '3', end: '3' }];
    expect(isPredictionMarketIntentApproval(a)).toBe(false);
  });

  it('rejects when overallMaxNumTransfers is not 1 (must be all-or-nothing)', () => {
    const a = clone(baseIntent);
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = '2';
    expect(isPredictionMarketIntentApproval(a)).toBe(false);

    const b = clone(baseIntent);
    b.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = '0';
    expect(isPredictionMarketIntentApproval(b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validatePredictionMarketCollection
// ---------------------------------------------------------------------------

describe('validatePredictionMarketCollection', () => {
  it('validates a fully correct collection with no errors', () => {
    const result = validatePredictionMarketCollection(makeValidCollection());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.details.hasMintApproval).toBe(true);
    expect(result.details.hasRedeemApproval).toBe(true);
    expect(result.details.hasYesWinsApproval).toBe(true);
    expect(result.details.hasNoWinsApproval).toBe(true);
    expect(result.details.hasPushYesApproval).toBe(true);
    expect(result.details.hasPushNoApproval).toBe(true);
    expect(result.details.depositDenom).toBe('ubadge');
    expect(result.details.depositAmount).toBe('1000000');
    expect(result.details.verifierAddress).toBe('bb1verifier');
  });

  it('fails when collection is null/undefined', () => {
    const r1 = validatePredictionMarketCollection(null);
    expect(r1.valid).toBe(false);
    expect(r1.errors).toContain('Collection is missing or undefined');

    const r2 = validatePredictionMarketCollection(undefined);
    expect(r2.valid).toBe(false);
  });

  it('fails when standards does not include "Prediction Market"', () => {
    const col = makeValidCollection();
    col.standards = ['Something Else'];
    const r = validatePredictionMarketCollection(col);
    expect(r.errors).toContain('Collection standards must include "Prediction Market"');
  });

  it('fails when validTokenIds is not exactly [1, 2]', () => {
    const col = makeValidCollection();
    col.validTokenIds = range('1', '3');
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Valid token IDs must be exactly'))).toBe(true);
  });

  it('fails when disablePoolCreation is true', () => {
    const col = makeValidCollection();
    col.invariants.disablePoolCreation = true;
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('disablePoolCreation must be false'))).toBe(true);
  });

  it('fails when aliasPaths count is not 2', () => {
    const col = makeValidCollection();
    col.aliasPaths = [col.aliasPaths[0]];
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Must have exactly 2 alias paths'))).toBe(true);
  });

  it('fails when uyes alias is missing', () => {
    const col = makeValidCollection();
    col.aliasPaths[0].denom = 'notUyes';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Missing alias path with denom "uyes"'))).toBe(true);
  });

  it('fails when uno alias is missing', () => {
    const col = makeValidCollection();
    col.aliasPaths[1].denom = 'notUno';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Missing alias path with denom "uno"'))).toBe(true);
  });

  it('warns when uyes decimals are not 6', () => {
    const col = makeValidCollection();
    col.aliasPaths[0].denomUnits[0].decimals = '18';
    const r = validatePredictionMarketCollection(col);
    expect(r.warnings.some((w) => w.includes('YES alias path (uyes) denomUnit decimals should be 6'))).toBe(true);
  });

  it('warns when uno decimals are not 6', () => {
    const col = makeValidCollection();
    col.aliasPaths[1].denomUnits[0].decimals = '18';
    const r = validatePredictionMarketCollection(col);
    expect(r.warnings.some((w) => w.includes('NO alias path (uno) denomUnit decimals should be 6'))).toBe(true);
  });

  it('fails when uyes conversion does not target token id 1', () => {
    const col = makeValidCollection();
    col.aliasPaths[0].conversion.sideB[0].tokenIds = range('2', '2');
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('YES alias path (uyes) conversion must target token ID 1'))).toBe(true);
  });

  it('fails when uno conversion does not target token id 2', () => {
    const col = makeValidCollection();
    col.aliasPaths[1].conversion.sideB[0].tokenIds = range('1', '1');
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('NO alias path (uno) conversion must target token ID 2'))).toBe(true);
  });

  it('fails when uyes denomUnits is empty', () => {
    const col = makeValidCollection();
    col.aliasPaths[0].denomUnits = [];
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('YES alias path (uyes) must have at least one denomUnit'))).toBe(true);
  });

  it('fails when collectionPermissions is missing', () => {
    const col: any = makeValidCollection();
    col.collectionPermissions = undefined;
    const r = validatePredictionMarketCollection(col);
    expect(r.errors).toContain('Collection permissions are missing');
  });

  it('warns when canDeleteCollection is not frozen', () => {
    const col: any = makeValidCollection();
    col.collectionPermissions.canDeleteCollection = [];
    const r = validatePredictionMarketCollection(col);
    expect(r.warnings.some((w) => w.includes('Delete collection'))).toBe(true);
  });

  it('warns when canUpdateCollectionApprovals is not frozen', () => {
    const col: any = makeValidCollection();
    col.collectionPermissions.canUpdateCollectionApprovals = [];
    const r = validatePredictionMarketCollection(col);
    expect(r.warnings.some((w) => w.includes('Update collection approvals'))).toBe(true);
  });

  it('warns when canUpdateValidTokenIds is not frozen', () => {
    const col: any = makeValidCollection();
    col.collectionPermissions.canUpdateValidTokenIds = [];
    const r = validatePredictionMarketCollection(col);
    expect(r.warnings.some((w) => w.includes('Update valid token IDs'))).toBe(true);
  });

  it('fails when collection has fewer than 7 approvals', () => {
    const col: any = makeValidCollection();
    col.collectionApprovals = col.collectionApprovals.slice(0, 3);
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Expected at least 7 collection approvals'))).toBe(true);
  });

  it('fails when mint approval is missing', () => {
    const col: any = makeValidCollection();
    col.collectionApprovals = col.collectionApprovals.filter((a: any) => a.fromListId !== 'Mint');
    // Pad back to 7
    col.collectionApprovals.push(makeTransferableApproval(), makeTransferableApproval());
    const r = validatePredictionMarketCollection(col);
    expect(r.errors).toContain('Missing paired mint approval (fromListId: "Mint")');
  });

  it('fails when transferable approval is missing', () => {
    const col: any = makeValidCollection();
    col.collectionApprovals = col.collectionApprovals.filter((a: any) => !(a.fromListId === 'All' && a.toListId === 'All'));
    const r = validatePredictionMarketCollection(col);
    expect(r.errors).toContain('Missing freely transferable approval (allows transfers between users/pools)');
  });

  it('fails when mint approval has wrong toListId', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.toListId = 'NotAll';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('toListId must be "All"'))).toBe(true);
  });

  it('fails when mint approval has no coinTransfers', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.approvalCriteria.coinTransfers = [];
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('must have exactly 1 coin transfer'))).toBe(true);
  });

  it('fails when mint coin transfer has empty "to"', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.approvalCriteria.coinTransfers[0].to = '';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('coin transfer "to" must be'))).toBe(true);
  });

  it('warns when mint "to" is not "Mint"', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.approvalCriteria.coinTransfers[0].to = 'bb1somewhere';
    const r = validatePredictionMarketCollection(col);
    expect(r.warnings.some((w) => w.includes('Deposit coinTransfer "to" should be "Mint"'))).toBe(true);
  });

  it('fails when mint overrideFromWithApproverAddress is true', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = true;
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('coin transfer overrideFromWithApproverAddress must be false'))).toBe(true);
    expect(r.errors.some((e) => e.includes('Deposit coinTransfer must not use overrideFromWithApproverAddress'))).toBe(true);
  });

  it('fails when mint startBalances do not cover both tokens', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [
      { tokenIds: range('1', '1'), amount: '1000000' }
    ];
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('startBalances must cover both YES (token 1) and NO (token 2)'))).toBe(true);
  });

  it('fails when mint overallMaxNumTransfers is not 0', () => {
    const col: any = makeValidCollection();
    const mint = col.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    mint.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = '5';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('overallMaxNumTransfers should be 0'))).toBe(true);
  });

  it('fails when redeem approval uses wrong overrideFromWithApproverAddress', () => {
    const col: any = makeValidCollection();
    // Swap redeem (second approval in our fixture) — but find by identity
    // Redeem is the one with fromListId !Mint, burn address, no votingChallenges
    const redeem = col.collectionApprovals.find(
      (a: any) => a.fromListId === '!Mint' && a.toListId === BURN_ADDRESS && !(a.approvalCriteria.votingChallenges ?? []).length
    );
    redeem.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = false;
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Pre-settlement redeem approval: coin transfer overrideFromWithApproverAddress must be true'))).toBe(true);
  });

  it('fails when redeem approval has overallMaxNumTransfers of 0', () => {
    const col: any = makeValidCollection();
    const redeem = col.collectionApprovals.find(
      (a: any) => a.fromListId === '!Mint' && a.toListId === BURN_ADDRESS && !(a.approvalCriteria.votingChallenges ?? []).length
    );
    redeem.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = '0';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('Pre-settlement redeem approval: overallMaxNumTransfers must be > 0'))).toBe(true);
  });

  it('fails when settlement approval is missing voting challenges', () => {
    const col: any = makeValidCollection();
    const yesWins = col.collectionApprovals.find(
      (a: any) =>
        a.toListId === BURN_ADDRESS &&
        (a.approvalCriteria.votingChallenges ?? []).length > 0 &&
        a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds[0].start === '1' &&
        a.approvalCriteria.coinTransfers[0].coins[0].amount === '1000000' // non-push
    );
    yesWins.approvalCriteria.votingChallenges = [];
    const r = validatePredictionMarketCollection(col);
    // Removing voting challenges causes YES wins to not be found anymore
    expect(r.errors).toContain('Missing "YES wins" settlement approval');
  });

  it('fails when denoms differ across coinTransfers', () => {
    const col: any = makeValidCollection();
    const redeem = col.collectionApprovals.find(
      (a: any) => a.fromListId === '!Mint' && a.toListId === BURN_ADDRESS && !(a.approvalCriteria.votingChallenges ?? []).length
    );
    redeem.approvalCriteria.coinTransfers[0].coins[0].denom = 'ubadge-other';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('All coinTransfers must use the same denom'))).toBe(true);
  });

  it('fails when YES wins payout amount does not match deposit', () => {
    const col: any = makeValidCollection();
    const yesWins = col.collectionApprovals.find(
      (a: any) =>
        a.toListId === BURN_ADDRESS &&
        (a.approvalCriteria.votingChallenges ?? []).length > 0 &&
        a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds[0].start === '1' &&
        a.approvalCriteria.coinTransfers[0].coins[0].amount === '1000000'
    );
    // Set payout to 999999 (not half, so not reclassified as push) — should flag mismatch
    yesWins.approvalCriteria.coinTransfers[0].coins[0].amount = '999999';
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('YES wins: payout amount 999999 does not match expected 1000000'))).toBe(true);
  });

  it('extracts verifierAddress from YES wins voting challenge', () => {
    const col = makeValidCollection();
    const r = validatePredictionMarketCollection(col);
    expect(r.details.verifierAddress).toBe('bb1verifier');
  });

  it('fails when voting challenge has no voters', () => {
    const col: any = makeValidCollection();
    const yesWins = col.collectionApprovals.find(
      (a: any) =>
        a.toListId === BURN_ADDRESS &&
        (a.approvalCriteria.votingChallenges ?? []).length > 0 &&
        a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds[0].start === '1' &&
        a.approvalCriteria.coinTransfers[0].coins[0].amount === '1000000'
    );
    yesWins.approvalCriteria.votingChallenges[0].voters = [];
    const r = validatePredictionMarketCollection(col);
    expect(r.errors.some((e) => e.includes('voting challenge must have at least 1 voter'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isPredictionMarketValid
// ---------------------------------------------------------------------------

describe('isPredictionMarketValid', () => {
  it('returns true for a valid collection', () => {
    expect(isPredictionMarketValid(makeValidCollection())).toBe(true);
  });

  it('returns false for a null collection', () => {
    expect(isPredictionMarketValid(null)).toBe(false);
  });

  it('returns false when standards are missing', () => {
    const col = makeValidCollection();
    col.standards = [];
    expect(isPredictionMarketValid(col)).toBe(false);
  });

  it('returns true when only warnings are present (e.g. wrong decimals)', () => {
    const col = makeValidCollection();
    col.aliasPaths[0].denomUnits[0].decimals = '18';
    expect(isPredictionMarketValid(col)).toBe(true);
  });
});
