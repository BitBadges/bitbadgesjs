/**
 * Tests for `redeem_claim` — the one-shot MCP tool that collapses the
 * 5-call claim-redemption flow (completeClaim → poll status →
 * getReservedClaimCodes → getMerkleProofInfo → hand-stitch
 * MsgTransferTokens) into a single tool call.
 *
 * We mock `apiClient.js` module-level to intercept all five endpoints and
 * assert:
 *   1. Flat verb (`code`) auto-maps onto the right plugin instanceId
 *   2. Polling continues until terminal `success: true` or `error` fires
 *   3. Standalone claims (no trackerDetails) short-circuit after polling
 *   4. On-chain claims auto-fetch reserved codes + merkle proof and
 *      return a MsgTransferTokens matching build_transfer's shape
 *   5. Failure modes (unknown plugin input, polling timeout,
 *      missing reserved code) surface as structured errors
 */

import { redeemClaimSchema, handleRedeemClaim, redeemClaimTool } from './redeemClaim.js';

const getClaimsMock = jest.fn();
const completeClaimMock = jest.fn();
const getClaimAttemptStatusMock = jest.fn();
const getReservedClaimCodesMock = jest.fn();
const getMerkleProofInfoMock = jest.fn();

jest.mock('../../sdk/apiClient.js', () => ({
  getClaims: (...args: unknown[]) => getClaimsMock(...args),
  completeClaim: (...args: unknown[]) => completeClaimMock(...args),
  getClaimAttemptStatus: (...args: unknown[]) => getClaimAttemptStatusMock(...args),
  getReservedClaimCodes: (...args: unknown[]) => getReservedClaimCodesMock(...args),
  getMerkleProofInfo: (...args: unknown[]) => getMerkleProofInfoMock(...args)
}));

const MAX_UINT64 = '18446744073709551615';
const USER_ADDR = 'bb1qq0yvpj9sjvflklk67gnhpdxplxdzsgp30kfe6';

function defaultClaim(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    claimId: 'claim-1',
    plugins: [
      { pluginId: 'numUses', instanceId: 'numUses' },
      { pluginId: 'codes', instanceId: 'codes-gate' }
    ],
    standaloneClaim: true,
    ...overrides
  };
}

function onChainClaim(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    claimId: 'claim-1',
    plugins: [
      { pluginId: 'numUses', instanceId: 'numUses' },
      { pluginId: 'codes', instanceId: 'codes-gate' }
    ],
    standaloneClaim: false,
    collectionId: '42',
    trackerDetails: {
      collectionId: '42',
      approvalId: 'mint-approval',
      approvalLevel: 'collection',
      approverAddress: '',
      challengeTrackerId: 'tracker-1'
    },
    ...overrides
  };
}

describe('redeem_claim — schema', () => {
  it('accepts minimum inputs', () => {
    const parsed = redeemClaimSchema.safeParse({
      claimId: 'claim-1',
      address: 'bb1abc'
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts full inputs including pollTimeoutMs, expectedVersion, returnTransfer', () => {
    const parsed = redeemClaimSchema.safeParse({
      claimId: 'claim-1',
      address: 'bb1abc',
      inputs: { code: 'xyz' },
      expectedVersion: 3,
      pollTimeoutMs: 10_000,
      returnTransfer: false
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects missing claimId', () => {
    const parsed = redeemClaimSchema.safeParse({ address: 'bb1abc' });
    expect(parsed.success).toBe(false);
  });

  it('rejects negative pollTimeoutMs', () => {
    const parsed = redeemClaimSchema.safeParse({
      claimId: 'c',
      address: 'bb1abc',
      pollTimeoutMs: -1
    });
    expect(parsed.success).toBe(false);
  });
});

describe('redeem_claim — tool schema', () => {
  it('exposes the expected name and required fields', () => {
    expect(redeemClaimTool.name).toBe('redeem_claim');
    expect(redeemClaimTool.inputSchema.required).toEqual(['claimId', 'address']);
  });
});

describe('redeem_claim — happy paths', () => {
  beforeEach(() => {
    [
      getClaimsMock,
      completeClaimMock,
      getClaimAttemptStatusMock,
      getReservedClaimCodesMock,
      getMerkleProofInfoMock
    ].forEach((m) => m.mockReset());
  });

  it('standalone claim: flat `code` maps to instanceId + stops after polling', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [defaultClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-1' } });
    // First poll: still pending. Second: success.
    getClaimAttemptStatusMock
      .mockResolvedValueOnce({
        success: true,
        data: { success: false, error: '', bitbadgesAddress: USER_ADDR }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { success: true, error: '', bitbadgesAddress: USER_ADDR }
      });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      pollTimeoutMs: 5_000
    });

    expect(res.success).toBe(true);
    expect(res.claimAttemptId).toBe('att-1');
    expect(res.onChain).toBe(false);
    expect(res.transaction).toBeUndefined();

    // Verify completeClaim received the instanceId-keyed body, NOT the flat verb
    const [, , payload] = completeClaimMock.mock.calls[0];
    expect(payload).toEqual({
      _expectedVersion: -1,
      'codes-gate': { code: 'xyz' }
    });
    // We did NOT call the on-chain endpoints
    expect(getReservedClaimCodesMock).not.toHaveBeenCalled();
    expect(getMerkleProofInfoMock).not.toHaveBeenCalled();
  });

  it('on-chain claim: fetches reserved codes + merkle proof + returns MsgTransferTokens', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [onChainClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-2' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: true, error: '', code: 'merkle-code-xyz', bitbadgesAddress: USER_ADDR }
    });
    getReservedClaimCodesMock.mockResolvedValue({
      success: true,
      data: { reservedCodes: ['merkle-code-xyz'], leafSignatures: ['0xsig'] }
    });
    getMerkleProofInfoMock.mockResolvedValue({
      success: true,
      data: {
        allProofDetails: [
          {
            proofObj: [
              { aunt: 'hash-1', onRight: true },
              { aunt: 'hash-2', onRight: false }
            ],
            isValidProof: true,
            leafIndex: 0,
            leaf: 'merkle-code-xyz'
          }
        ]
      }
    });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      pollTimeoutMs: 5_000
    });

    expect(res.success).toBe(true);
    expect(res.onChain).toBe(true);
    expect(res.code).toBe('merkle-code-xyz');
    expect(res.transaction).toBeDefined();

    // Transaction matches build_transfer's shape: one tokenization
    // MsgTransferTokens carrying the merkle proof.
    const msg: any = res.transaction!.messages[0];
    expect(msg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(msg.value.collectionId).toBe('42');
    expect(msg.value.creator).toBe(USER_ADDR);
    const transfer = msg.value.transfers[0];
    expect(transfer.from).toBe('Mint');
    expect(transfer.toAddresses).toEqual([USER_ADDR]);
    expect(transfer.merkleProofs).toEqual([
      {
        leaf: 'merkle-code-xyz',
        leafSignature: '0xsig',
        aunts: [
          { aunt: 'hash-1', onRight: true },
          { aunt: 'hash-2', onRight: false }
        ]
      }
    ]);
    expect(transfer.prioritizedApprovals).toEqual([
      {
        approvalId: 'mint-approval',
        approvalLevel: 'collection',
        approverAddress: '',
        version: '0'
      }
    ]);
    // FOREVER range for tokenIds + ownershipTimes
    expect(transfer.balances[0].tokenIds).toEqual([{ start: '1', end: MAX_UINT64 }]);
    expect(transfer.balances[0].ownershipTimes).toEqual([{ start: '1', end: MAX_UINT64 }]);

    // And the merkle-proof-info call received the full tracker context.
    const [merkleReq] = getMerkleProofInfoMock.mock.calls[0];
    expect(merkleReq).toMatchObject({
      collectionId: '42',
      approvalId: 'mint-approval',
      approvalLevel: 'collection',
      approverAddress: '',
      challengeTrackerId: 'tracker-1',
      leaves: ['merkle-code-xyz']
    });
  });

  it('on-chain claim with returnTransfer: false → skips merkle proof build', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [onChainClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-3' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: true, error: '', code: 'code-abc', bitbadgesAddress: USER_ADDR }
    });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      returnTransfer: false,
      pollTimeoutMs: 5_000
    });

    expect(res.success).toBe(true);
    expect(res.onChain).toBe(true);
    expect(res.transaction).toBeUndefined();
    expect(getReservedClaimCodesMock).not.toHaveBeenCalled();
    expect(getMerkleProofInfoMock).not.toHaveBeenCalled();
  });

  it('power-user: raw { [instanceId]: body } is passed through unchanged', async () => {
    // Claim has a `codes` plugin but under a user-chosen instanceId
    // that doesn't match the flat-verb convention. The agent can still
    // pass the raw shape and we forward it.
    getClaimsMock.mockResolvedValue({
      success: true,
      data: {
        claims: [
          defaultClaim({
            plugins: [
              { pluginId: 'numUses', instanceId: 'numUses' },
              { pluginId: 'codes', instanceId: 'custom-codes-abc' }
            ]
          })
        ]
      }
    });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-4' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: true, error: '', bitbadgesAddress: USER_ADDR }
    });

    await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { 'custom-codes-abc': { code: 'xyz' } },
      pollTimeoutMs: 2_000
    });

    const [, , payload] = completeClaimMock.mock.calls[0];
    expect(payload).toEqual({
      _expectedVersion: -1,
      'custom-codes-abc': { code: 'xyz' }
    });
  });

  it('explicit expectedVersion is honored', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [defaultClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-5' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: true, error: '', bitbadgesAddress: USER_ADDR }
    });

    await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      expectedVersion: 3,
      pollTimeoutMs: 2_000
    });

    const [, , payload] = completeClaimMock.mock.calls[0];
    expect(payload._expectedVersion).toBe(3);
  });
});

describe('redeem_claim — failure modes', () => {
  beforeEach(() => {
    [
      getClaimsMock,
      completeClaimMock,
      getClaimAttemptStatusMock,
      getReservedClaimCodesMock,
      getMerkleProofInfoMock
    ].forEach((m) => m.mockReset());
  });

  it('claimId not found → structured error, no completeClaim call', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [] } });
    const res = await handleRedeemClaim({
      claimId: 'missing',
      address: USER_ADDR,
      inputs: { code: 'xyz' }
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found/i);
    expect(completeClaimMock).not.toHaveBeenCalled();
  });

  it('inputs key doesn\'t map to any plugin → returns discovered plugin list', async () => {
    // Claim has no `password` plugin, but inputs uses one.
    getClaimsMock.mockResolvedValue({
      success: true,
      data: {
        claims: [
          defaultClaim({
            plugins: [
              { pluginId: 'numUses', instanceId: 'numUses' },
              { pluginId: 'whitelist', instanceId: 'wl' }
            ]
          })
        ]
      }
    });
    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { password: 'secret' }
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/plugin|instanceId/i);
    expect(res.discovered?.plugins).toEqual([
      { pluginId: 'numUses', instanceId: 'numUses' },
      { pluginId: 'whitelist', instanceId: 'wl' }
    ]);
    expect(completeClaimMock).not.toHaveBeenCalled();
  });

  it('terminal error from claim attempt polling → propagates with claimAttemptId', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [defaultClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-err' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: false, error: 'invalid code', bitbadgesAddress: USER_ADDR }
    });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'wrong' },
      pollTimeoutMs: 2_000
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('invalid code');
    expect(res.claimAttemptId).toBe('att-err');
  });

  it('polling times out before terminal → synthetic "Polling timed out" error', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [defaultClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-tmo' } });
    // Always pending — never terminal
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: false, error: '', bitbadgesAddress: USER_ADDR }
    });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      pollTimeoutMs: 100 // tight bound so the test finishes fast
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/timed out/i);
    expect(res.claimAttemptId).toBe('att-tmo');
  });

  it('on-chain claim with empty reservedCodes → structured error', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [onChainClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-nc' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: true, error: '', bitbadgesAddress: USER_ADDR }
    });
    getReservedClaimCodesMock.mockResolvedValue({
      success: true,
      data: { reservedCodes: [], leafSignatures: [] }
    });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      pollTimeoutMs: 2_000
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/reserved claim code/i);
    expect(getMerkleProofInfoMock).not.toHaveBeenCalled();
  });

  it('invalid merkle proof from indexer → structured error', async () => {
    getClaimsMock.mockResolvedValue({ success: true, data: { claims: [onChainClaim()] } });
    completeClaimMock.mockResolvedValue({ success: true, data: { claimAttemptId: 'att-mp' } });
    getClaimAttemptStatusMock.mockResolvedValue({
      success: true,
      data: { success: true, error: '', bitbadgesAddress: USER_ADDR }
    });
    getReservedClaimCodesMock.mockResolvedValue({
      success: true,
      data: { reservedCodes: ['code-1'], leafSignatures: ['0xsig'] }
    });
    getMerkleProofInfoMock.mockResolvedValue({
      success: true,
      data: {
        allProofDetails: [
          { proofObj: [], isValidProof: false, leafIndex: -1, leaf: '' }
        ]
      }
    });

    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' },
      pollTimeoutMs: 2_000
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/merkle proof/i);
  });

  it('API-layer error on getClaims → propagates untouched', async () => {
    getClaimsMock.mockResolvedValue({
      success: false,
      error: 'BITBADGES_API_KEY environment variable not set. Set it to use API query tools.'
    });
    const res = await handleRedeemClaim({
      claimId: 'claim-1',
      address: USER_ADDR,
      inputs: { code: 'xyz' }
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/BITBADGES_API_KEY/);
  });
});
