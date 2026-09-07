/**
 * A cold CLI user runs `bb build …`, gets a wall of JSON, and has no idea
 * that reviewing and signing happens in the browser. The envelope's `hint`
 * slot is the machine-readable place to say what comes next.
 */
import { buildNextStepHint } from './next-step.js';

describe('buildNextStepHint', () => {
  it('points at the review-and-sign handoff after a plain build', () => {
    const hint = buildNextStepHint({});
    expect(hint).toContain('bb preview');
    expect(hint).toContain('--open');
  });

  it('names the written file so the next command is copy-pasteable', () => {
    expect(buildNextStepHint({ outputFile: 'tx.json' })).toContain('bb preview tx.json --open');
    // Without a file the tx is on stdout, so the next command reads stdin.
    expect(buildNextStepHint({})).toContain('bb preview - --open');
  });

  it('stays silent when the command already broadcast', () => {
    expect(buildNextStepHint({ deployRequested: true })).toBeUndefined();
  });

  it('stays silent in quiet mode so agent pipelines are not polluted', () => {
    expect(buildNextStepHint({ quiet: true })).toBeUndefined();
  });
});
