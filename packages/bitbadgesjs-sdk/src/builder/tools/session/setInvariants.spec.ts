/**
 * Tests for `set_invariants` builder tool.
 *
 * handleSetInvariants is a thin wrapper around setInvariantsInSession. It's
 * trivial in code but important to pin down because invariants cannot be
 * removed after collection creation — a wrong value set here is
 * un-reversible on-chain. These tests verify:
 *
 *   - happy paths for each invariant shape (none / subscription / smart token)
 *   - explicit `null` to clear invariants is passed through verbatim
 *   - `updateInvariants` flag is flipped so downstream tx uses the value
 *   - session isolation by sessionId
 *   - re-calling replaces (set semantics), does not merge
 */
import { handleSetInvariants } from './setInvariants.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

describe('handleSetInvariants', () => {
  beforeEach(() => resetAllSessions());

  it('writes a simple noCustomOwnershipTimes=true invariant', () => {
    const session = getOrCreateSession();
    // updateInvariants defaults to true, so the assertion below would be
    // vacuous without first resetting to false.
    session.messages[0].value.updateInvariants = false;
    const res = handleSetInvariants({ invariants: { noCustomOwnershipTimes: true } });
    expect(res.success).toBe(true);
    expect(session.messages[0].value.invariants).toEqual({ noCustomOwnershipTimes: true });
    expect(session.messages[0].value.updateInvariants).toBe(true);
  });

  it('writes a subscription-style invariant (noCustomOwnershipTimes=false, maxSupplyPerId=1)', () => {
    const res = handleSetInvariants({
      invariants: { noCustomOwnershipTimes: false, maxSupplyPerId: '1' }
    });
    expect(res.success).toBe(true);
    const inv = getOrCreateSession().messages[0].value.invariants;
    expect(inv.noCustomOwnershipTimes).toBe(false);
    expect(inv.maxSupplyPerId).toBe('1');
  });

  it('writes a full smart-token invariant with cosmosCoinBackedPath', () => {
    const path = {
      conversion: {
        sideA: { amount: '1', denom: 'ibc/ABC123' },
        sideB: [{
          amount: '1',
          tokenIds: [{ start: '1', end: '1' }],
          ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
        }]
      }
    };
    const res = handleSetInvariants({ invariants: { cosmosCoinBackedPath: path } });
    expect(res.success).toBe(true);
    expect(getOrCreateSession().messages[0].value.invariants.cosmosCoinBackedPath).toEqual(path);
  });

  it('passes through null to clear invariants', () => {
    handleSetInvariants({ invariants: { noCustomOwnershipTimes: true } });
    const res = handleSetInvariants({ invariants: null });
    expect(res.success).toBe(true);
    expect(getOrCreateSession().messages[0].value.invariants).toBeNull();
  });

  it('replaces invariants on re-call (does not merge)', () => {
    handleSetInvariants({ invariants: { noCustomOwnershipTimes: true, maxSupplyPerId: '0' } });
    handleSetInvariants({ invariants: { disablePoolCreation: true } });
    const inv = getOrCreateSession().messages[0].value.invariants;
    expect(inv).toEqual({ disablePoolCreation: true });
    expect(inv.noCustomOwnershipTimes).toBeUndefined();
  });

  it('isolates invariants per sessionId', () => {
    handleSetInvariants({ sessionId: 'a', invariants: { noCustomOwnershipTimes: true } });
    handleSetInvariants({ sessionId: 'b', invariants: { noCustomOwnershipTimes: false } });
    expect(getOrCreateSession('a').messages[0].value.invariants.noCustomOwnershipTimes).toBe(true);
    expect(getOrCreateSession('b').messages[0].value.invariants.noCustomOwnershipTimes).toBe(false);
  });

  it('auto-creates a session if none exists', () => {
    handleSetInvariants({ invariants: { noCustomOwnershipTimes: true } });
    // The call should have created the default session even though we never
    // explicitly initialised it elsewhere.
    expect(getOrCreateSession().messages).toHaveLength(1);
    expect(getOrCreateSession().messages[0].typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
  });

  it('uses creatorAddress when initialising a fresh session', () => {
    handleSetInvariants({ creatorAddress: 'bb1abc', invariants: { noCustomOwnershipTimes: true } });
    // creator is bech32-normalised by ensureBb1; we only assert it is non-empty.
    const value = getOrCreateSession().messages[0].value;
    expect(typeof value.creator).toBe('string');
    expect(value.creator.length).toBeGreaterThan(0);
  });
});
