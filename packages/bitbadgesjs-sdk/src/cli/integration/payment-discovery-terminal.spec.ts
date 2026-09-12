import { runCli } from './harness/cli.js';
import { extractPaymentRequestV2Details, getPaymentRequestV2Type } from '../../core/payment-requests-v2.js';

it('exposes the additive V2 alias while preserving the legacy build alias', () => {
  const v2 = runCli(['pay-requests', 'build-v2', '--help'], { parseJson: false });
  expect(v2.stdout).toContain('--list-examples');
  const legacy = runCli(['pay-requests', 'build', '--help'], { parseJson: false });
  expect(legacy.stdout).not.toContain('--list-examples');
});

it('pipes example parameters through stdin and the public V2 alias without credentials', () => {
  const example = runCli(['build', 'payment-request-v2', '--example', 'all']);
  expect(example.envelope.ok).toBe(true);
  const params = JSON.stringify(example.json);
  const canonical = runCli(['build', 'payment-request-v2', '--json', '-', '--json-only'], { stdin: params });
  const alias = runCli(['pay-requests', 'build-v2', '--json', '-', '--json-only'], { stdin: params });
  expect(alias.envelope.ok).toBe(true);
  expect(alias.json).toEqual(canonical.json);
  expect(getPaymentRequestV2Type(extractPaymentRequestV2Details(alias.json.value)!)).toBe('all');
});

it('reports invalid discovery combinations as a nonzero command error without outputting a transaction', () => {
  const result = runCli(['build', 'payment-request-v2', '--schema', '--burner'], { throwOnError: false });
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).not.toContain('MsgCreateCollection');
  expect(result.stderr + result.stdout).toContain('Discovery cannot be combined');
});
