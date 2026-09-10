import { handleBuildAgentVault } from './buildAgentVault.js';
import { getTransaction, importSession, resetAllSessions } from '../../session/sessionState.js';
import { convertToBitBadgesAddress } from '../../../address-converter/converter.js';
import { validateAgentVaultCollection } from '../../../core/agent-vaults.js';

const params = {
  agent: convertToBitBadgesAddress('0x1111111111111111111111111111111111111111'),
  manager: convertToBitBadgesAddress('0x2222222222222222222222222222222222222222'),
  backingCoin: 'BADGE',
  uri: 'ipfs://test'
};
afterEach(resetAllSessions);
it('places the verified unsigned vault in the builder session', () => {
  const result = handleBuildAgentVault({ sessionId: 'vault', params });
  expect(result.success).toBe(true);
  expect(validateAgentVaultCollection(getTransaction('vault').messages[0].value).valid).toBe(true);
});
it('does not replace an existing collection update or mutate state on invalid input', () => {
  importSession('vault', { messages: [{ typeUrl: '/tokenization.MsgUniversalUpdateCollection', value: { collectionId: '7' } }] });
  expect(() => handleBuildAgentVault({ sessionId: 'vault', params })).toThrow();
  expect(getTransaction('vault').messages[0].value.collectionId).toBe('7');
  expect(() => handleBuildAgentVault({ sessionId: 'new', params: { ...params, manager: params.agent } })).toThrow();
});
