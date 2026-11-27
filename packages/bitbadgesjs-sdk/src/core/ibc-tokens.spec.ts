import { generateAliasAddressForDenom } from './aliases.js';
import {
  inspectIbcTokenCollection,
  validateIbcTokenCollection,
  doesCollectionFollowIbcTokenProtocol,
  selectIbcWrapperPath,
  selectIbcWrapperApproval,
  resolveIbcTokenAmount,
  buildIbcTokenWrapMsg,
  buildIbcTokenUnwrapMsg
} from './ibc-tokens.js';

const ALICE = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';

function ibcCollectionFixture(overrides: Record<string, any> = {}): any {
  const denom = 'umytoken';
  const address = generateAliasAddressForDenom(denom);
  return {
    collectionId: '12',
    manager: '',
    isArchived: false,
    standards: ['IBC Token Factory'],
    validTokenIds: [{ start: 1n, end: 1n }],
    cosmosCoinWrapperPaths: [
      {
        denom,
        symbol: 'MYT',
        address,
        denomUnits: [{ symbol: 'MYT', decimals: 6n, isDefaultDisplay: true }],
        conversion: {
          sideA: { amount: 1n },
          sideB: [{ amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: 18446744073709551615n }] }]
        },
        allowOverrideWithAnyValidToken: false
      }
    ],
    aliasPaths: [],
    collectionApprovals: [
      {
        approvalId: 'ibc-wrap',
        fromListId: 'All',
        toListId: 'All',
        initiatedByListId: 'All',
        version: 2n,
        approvalCriteria: { allowSpecialWrapping: true }
      }
    ],
    ...overrides
  };
}

describe('ibc-token standard helpers (BB-303)', () => {
  it('inspects wrapper paths, full denoms, derived addresses, and wrap/unwrap approvals', () => {
    const col = ibcCollectionFixture();
    const inspection = inspectIbcTokenCollection(col);
    expect(inspection.recognized).toBe(true);
    expect(inspection.configurationSupported).toBe(true);
    expect(inspection.wrapperPaths).toHaveLength(1);
    expect(inspection.wrapperPaths[0]).toMatchObject({
      denom: 'umytoken',
      fullDenom: 'badges:12:umytoken',
      symbol: 'MYT',
      address: generateAliasAddressForDenom('umytoken'),
      defaultDecimals: 6,
      defaultSymbol: 'MYT'
    });
    expect(inspection.actions.wrap).toEqual({ approvalIds: ['ibc-wrap'], requiresSelection: false });
    expect(inspection.actions.unwrap).toEqual({ approvalIds: ['ibc-wrap'], requiresSelection: false });
    expect(doesCollectionFollowIbcTokenProtocol(col)).toBe(true);
  });

  it('rejects missing standard tag, missing wrapper paths, address mismatch, and archived collections', () => {
    expect(validateIbcTokenCollection(ibcCollectionFixture({ standards: [] })).valid).toBe(false);
    expect(validateIbcTokenCollection(ibcCollectionFixture({ cosmosCoinWrapperPaths: [] })).valid).toBe(false);
    expect(validateIbcTokenCollection(ibcCollectionFixture({ isArchived: true })).valid).toBe(false);

    const mismatched = ibcCollectionFixture();
    mismatched.cosmosCoinWrapperPaths[0].address = ALICE;
    const res = validateIbcTokenCollection(mismatched);
    expect(res.valid).toBe(false);
    expect(res.errors.join(' ')).toMatch(/disagrees/);
  });

  it('requires explicit --denom and --approval-id when ambiguous and resolves decimal precision safely', () => {
    const multi = ibcCollectionFixture();
    multi.cosmosCoinWrapperPaths.push({
      ...multi.cosmosCoinWrapperPaths[0],
      denom: 'uother',
      symbol: 'OTH',
      address: generateAliasAddressForDenom('uother')
    });
    expect(() => selectIbcWrapperPath(multi)).toThrow(/--denom/);
    expect(selectIbcWrapperPath(multi, 'OTH').denom).toBe('uother');
    expect(selectIbcWrapperPath(multi, 'badges:12:umytoken').denom).toBe('umytoken');

    multi.collectionApprovals.push({ ...multi.collectionApprovals[0], approvalId: 'ibc-wrap-2' });
    expect(() => selectIbcWrapperApproval(multi, 'wrap')).toThrow(/--approval-id/);
    expect(selectIbcWrapperApproval(multi, 'wrap', 'ibc-wrap-2')?.approvalId).toBe('ibc-wrap-2');

    expect(resolveIbcTokenAmount('1.5', false, 6)).toBe('1500000');
    expect(resolveIbcTokenAmount('1500000', true, 6)).toBe('1500000');
    expect(() => resolveIbcTokenAmount('0', false, 6)).toThrow();
    expect(() => resolveIbcTokenAmount('1.0000001', false, 6)).toThrow(/decimal/);
  });

  it('builds wrap and unwrap MsgTransferTokens with exact wrapper alias routing', () => {
    const col = ibcCollectionFixture();
    const path = selectIbcWrapperPath(col);
    const approval = selectIbcWrapperApproval(col, 'wrap');

    const wrapMsg = buildIbcTokenWrapMsg({ creator: ALICE, collectionId: '12', amount: '1500000', path, approval });
    expect(wrapMsg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((wrapMsg.value.transfers as any)[0]).toMatchObject({
      from: ALICE,
      toAddresses: [path.address],
      balances: [{ amount: '1500000', tokenIds: [{ start: '1', end: '1' }] }],
      prioritizedApprovals: [{ approvalId: 'ibc-wrap', approvalLevel: 'collection', version: '2' }],
      onlyCheckPrioritizedCollectionApprovals: true
    });

    const unwrapMsg = buildIbcTokenUnwrapMsg({ creator: ALICE, collectionId: '12', amount: '500000', path, approval });
    expect((unwrapMsg.value.transfers as any)[0]).toMatchObject({
      from: path.address,
      toAddresses: [ALICE],
      balances: [{ amount: '500000', tokenIds: [{ start: '1', end: '1' }] }]
    });
  });
});
