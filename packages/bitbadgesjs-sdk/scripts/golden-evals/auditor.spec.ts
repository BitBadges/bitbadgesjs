import { runAuditorBenchmark } from './auditor.js';
import { callTool } from '../../src/builder/tools/registry.js';
import { reviewCollection } from '../../src/core/review.js';

const produce = async (tool: string, input: Record<string, unknown>) => {
  const result = await callTool(tool, input);
  if (result.isError) throw new Error(result.text);
  return result.result;
};

describe('static reviewer mutation benchmark', () => {
  it('measures real review recall, benign warnings and intent-only coverage separately', async () => {
    const report = await runAuditorBenchmark(produce, reviewCollection);
    expect(report.passed).toBe(true);
    expect(report.summary.detectable).toBeGreaterThanOrEqual(7);
    expect(report.summary.detected).toBe(report.summary.detectable);
    expect(report.summary.benign).toBeGreaterThanOrEqual(5);
    expect(report.summary.falsePositives).toBe(0);
    expect(report.summary.intentOnly).toBeGreaterThanOrEqual(4);
    expect(report.chainExecution).toBe('not-run');
  });
  it('fails when the reviewer misses defects or warns on every intentional configuration', async () => {
    const silent = await runAuditorBenchmark(produce, () => ({ findings: [] }));
    expect(silent.passed).toBe(false);
    expect(silent.summary.detected).toBe(0);
    const noisy = await runAuditorBenchmark(produce, () => ({ findings: [{ code: 'invented', severity: 'warning' }] }));
    expect(noisy.passed).toBe(false);
    expect(noisy.summary.falsePositives).toBe(noisy.summary.benign);
  });
  it('retains builder infrastructure errors instead of dropping cases', async () => {
    const result = await runAuditorBenchmark(async () => {
      throw new Error('builder unavailable');
    }, reviewCollection);
    expect(result.passed).toBe(false);
    expect(result.results.length).toBeGreaterThanOrEqual(16);
    expect(result.results.every((row) => row.error === 'builder unavailable')).toBe(true);
  });
});
