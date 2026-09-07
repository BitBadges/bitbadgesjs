/**
 * `creatorAddress` is optional on every session tool and nothing told an agent
 * it was only read when the session was created. An agent whose first call was
 * set_standards (with no address, since nothing said otherwise) got a
 * permanently empty creator, every later creatorAddress was discarded, and
 * get_transaction returned `creator: ""` — which the chain rejects only much
 * later, at deploy time.
 */
import { getCollectionValue, getOrCreateSession, resetAllSessions } from './sessionState.js';

const BB1 = 'bb1w63npeee74ewuudzf8cgvy6at4jn4mjr0a9r5p';

describe('creatorAddress backfill', () => {
  beforeEach(() => resetAllSessions());

  it('backfills creator and manager when the address arrives after session creation', () => {
    getOrCreateSession('ses_a'); // first touch, no address
    expect(getCollectionValue('ses_a').creator).toBe('');

    const value = getCollectionValue('ses_a', BB1);
    expect(value.creator).toBe(BB1);
    expect(value.manager).toBe(BB1);
  });

  it('does not overwrite a creator that is already set', () => {
    getOrCreateSession('ses_b', BB1);
    const other = 'bb1svqtjhjqpcdr39zw8q206mkdd92q8a8y2asytu';
    expect(getCollectionValue('ses_b', other).creator).toBe(BB1);
  });

  it('normalizes an EVM address for manager, not just creator', () => {
    const evm = '0x1234567890123456789012345678901234567890';
    const value = getCollectionValue('ses_c', evm);
    expect(value.creator.startsWith('bb1')).toBe(true);
    expect(value.manager).toBe(value.creator);
  });
});
