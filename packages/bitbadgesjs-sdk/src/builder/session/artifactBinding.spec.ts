import { callTool } from '../tools/registry.js';
import { getSessionBinding, assertSessionBinding } from './artifactBinding.js';
import { setCustomData, resetSession } from './sessionState.js';
import { handleValidateTransaction } from '../tools/utilities/validateTransaction.js';
describe('artifact-bound tool checks', () => {
  afterEach(() => { resetSession('first'); resetSession('second'); });
  it('isolates interleaved builds and rejects stale identity after direct mutation', () => {
    setCustomData('first', 'a'); setCustomData('second', 'b');
    const first = getSessionBinding('first'); const second = getSessionBinding('second');
    expect(first.artifactId).not.toBe(second.artifactId);
    setCustomData('first', 'changed');
    expect(() => assertSessionBinding(first)).toThrow(/stale/i);
    expect(() => assertSessionBinding(second)).not.toThrow();
  });
  it('never treats explicitly empty JSON as session selection', async () => {
    const result = handleValidateTransaction({ transactionJson: '', sessionId: 'first' });
    expect(result.valid).toBe(false);
    expect(result.issues[0].message).toMatch(/JSON/);
    const both = await callTool('validate_transaction', { transaction: {}, transactionJson: '{}', sessionId: 'first' });
    expect(both.isError).toBe(true);
  });
  it('returns actionable errors with stable paths without raw diagnostic values', async () => {
    const response = await callTool('set_custom_data', {});
    expect(response.error).toMatchObject({ code: 'invalid_input', retrySafe: false });
    expect(response.error?.issues.length).toBeGreaterThan(0);
    const malformed = await callTool('build_subscription', { interval: 123 });
    expect(malformed.isError).toBe(true);
  });
  it('registers intent checks and preserves original requirements across repairs', async () => {
    const result = await callTool('verify_intent', { artifact: { messages: [] }, intent: { version: 1, requirements: [], unresolvedDecisions: [] } });
    expect(result.result.status).toBe('unverified');
  });
});
