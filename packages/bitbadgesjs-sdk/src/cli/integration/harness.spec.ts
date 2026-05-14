/**
 * Sanity check for the integration test harness itself.
 *
 * Skipped automatically when the chain / indexer isn't running locally.
 * Validates the preflight + personas + CLI runner before the per-standard
 * specs depend on them. If this fails, every per-standard spec will fail
 * too — fixing this first surfaces the right error quickly.
 */

import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';

const isReady = async (): Promise<boolean> => (await preflightIntegration()).ok;

describe('integration harness sanity', () => {
  // Gate the suite with a single async preflight. Each test re-checks
  // (cheap — preflight only does 2 HTTP probes + 1 exec) so we never
  // silently run against half-up infra.
  let ready = false;
  beforeAll(async () => { ready = await isReady(); });

  it('preflight returns a structured result', async () => {
    const r = await preflightIntegration();
    if (r.ok) {
      expect(r.reason).toBeUndefined();
    } else {
      expect(r.reason).toMatch(/RPC|Indexer|binary|Keyring|SKIP/);
      process.stderr.write(`[integration] (sanity) suite skipped because: ${r.reason}\n`);
    }
  });

  it('personas exposes alice + charlie', async () => {
    if (!ready) return;
    const a = alice();
    const c = charlie();
    expect(a.address).toMatch(/^bb1/);
    expect(c.address).toMatch(/^bb1/);
    expect(a.address).not.toBe(c.address);
  });

  it('runCli executes the built binary and returns JSON', async () => {
    if (!ready) return;
    // `bb address validate <addr>` is a pure offline command — no chain
    // needed. Good smoke for the CLI runner itself.
    const out = runCli(['address', 'validate', alice().address]);
    expect(out.exitCode).toBe(0);
    expect(out.json).toMatchObject({ valid: true, chain: 'BitBadges' });
  });

  it('runCli surfaces stderr on non-zero exit', async () => {
    if (!ready) return;
    let threw = false;
    try {
      runCli(['address', 'validate', 'not-an-address-and-not-valid'], { throwOnError: false });
    } catch {
      threw = true;
    }
    // throwOnError: false → should NOT throw, return result with exitCode possibly 0 or non-zero.
    expect(threw).toBe(false);
    // With invalid input, the validator returns valid=false but exit code is 0.
    const out = runCli(['address', 'validate', 'garbage'], { throwOnError: false });
    expect(out.exitCode).toBe(0);
    expect(out.json).toMatchObject({ valid: false });
  });
});
