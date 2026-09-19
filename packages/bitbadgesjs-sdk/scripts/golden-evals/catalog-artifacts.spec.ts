import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { behavioralCases, fixtureTime, gradeBehavior } from './catalog.js';
import { runCases } from './runner.js';
import { callTool } from '../../src/builder/tools/registry.js';

it('rejects hidden escrow funding in a metadata-only update', () => {
  const test = behavioralCases.find((item) => item.id === 'update-metadata-only')!;
  const artifact = JSON.parse(readFileSync(join(__dirname, 'references/metadata-update.json'), 'utf8'));
  artifact.value.mintEscrowCoinsToTransfer = [{ denom: 'ubadge', amount: '1000000' }];
  expect(gradeBehavior(test, { disposition: 'propose', artifact, explanation: 'Metadata only.' }).passed).toBe(false);
});

it('executes all 15 reference proposals and rejects their meaningful mutations', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(fixtureTime);
  try {
    const proposals = behavioralCases.filter((test) => 'assertions' in test.oracle);
    expect(proposals).toHaveLength(15);
    for (const test of proposals) {
      if (!('assertions' in test.oracle)) throw new Error('Missing oracle');
      const oracle = test.oracle;
      const report = await runCases([oracle], async () => {
        if (test.reference) return JSON.parse(readFileSync(join(__dirname, 'references', test.reference + '.json'), 'utf8'));
        const result = await callTool(oracle.tool, oracle.input);
        if (result.isError) throw new Error(result.text);
        expect(gradeBehavior(test, { disposition: 'propose', artifact: result.result, explanation: 'Unsigned proposal.' }).passed).toBe(true);
        return result.result;
      });
      expect({ id: test.id, errors: report.results.filter((row) => !row.passed) }).toEqual({ id: test.id, errors: [] });
    }
  } finally {
    now.mockRestore();
  }
});
