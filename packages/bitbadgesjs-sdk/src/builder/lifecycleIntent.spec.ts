import { verifyLifecycleIntent } from './lifecycleIntent.js';
import * as runner from './lifecycle.js';
const message = { typeUrl: '/tokenization.MsgCreateCollection', value: { collectionId: '0', invariants: { maxSupplyPerId: '10' } } };
const artifact = { messages: [message] };
const intent = { version: 1, requirements: [{ id: 'cap', source: 'user', kind: 'supply', value: { maxSupplyPerId: '10' } }], unresolvedDecisions: [] };
const scenario = { version: 1, id: 'bound', steps: [{ id: 'create', message }] };
describe('artifact-bound lifecycle intent checks', () => {
  it('rejects a substituted artifact before executing any scenario', async () => {
    const run = jest.spyOn(runner, 'runLifecycle');
    try {
      await expect(verifyLifecycleIntent({ artifact, intent, scenario: { ...scenario, steps: [{ id: 'create', message: { ...message, value: {} } }] } })).rejects.toThrow(/artifact/);
      expect(run).not.toHaveBeenCalled();
    } finally { run.mockRestore(); }
  });
  it('retains static evidence and marks requirement-to-scenario coverage unverified', async () => {
    const run = jest.spyOn(runner, 'runLifecycle').mockResolvedValue({ status: 'satisfied', passed: true, scenarioHash: 'a'.repeat(64), coverage: { executed: ['module'], excluded: [] } } as any);
    try {
      const result = await verifyLifecycleIntent({ artifact, intent, scenario });
      expect(result.staticEvidence.requirements[0].status).toBe('satisfied');
      expect(result.status).toBe('unverified');
      expect(result.requirements[0]).toMatchObject({ requirementId: 'cap', status: 'unverified', source: 'none' });
      expect(result.lifecycle.passed).toBe(true);
      expect(result.coverage.unverified).toContain('requirement-to-scenario-coverage');
    } finally { run.mockRestore(); }
  });
  it('never hides a scenario failure behind a satisfied static artifact', async () => {
    const run = jest.spyOn(runner, 'runLifecycle').mockResolvedValue({ status: 'violated', passed: false, coverage: { executed: ['module'], excluded: [] } } as any);
    try { expect((await verifyLifecycleIntent({ artifact, intent, scenario })).status).toBe('violated'); }
    finally { run.mockRestore(); }
  });
});
