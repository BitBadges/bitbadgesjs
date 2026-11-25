import { executeInstalledCli } from './standardActions.js';

const original = process.env.BITBADGES_CLI_PATH;
beforeEach(() => {
  process.env.BITBADGES_CLI_PATH = process.execPath;
});
afterEach(() => {
  if (original === undefined) delete process.env.BITBADGES_CLI_PATH;
  else process.env.BITBADGES_CLI_PATH = original;
});

test('returns structured CLI failures but rejects success from a failed process', async () => {
  await expect(
    executeInstalledCli(['-e', 'console.log(JSON.stringify({ok:false,error:{code:"invalid_input",message:"Invalid units"}}));process.exit(1)'])
  ).resolves.toMatchObject({ ok: false, error: { code: 'invalid_input' } });
  await expect(executeInstalledCli(['-e', 'console.log(JSON.stringify({ok:true,data:{}}));process.exit(1)'])).rejects.toThrow(/failed|complete/i);
});

test('does not forward stderr into a tool response and requires a JSON envelope', async () => {
  const message = await executeInstalledCli(['-e', 'console.error("PRIVATE".toLowerCase() + "_diagnostic");process.exit(1)']).then(
    () => '',
    (error: Error) => error.message
  );
  expect(message).toMatch(/CLI rejected the input/);
  expect(message).not.toMatch(/private_diagnostic|not installed/);
  await expect(executeInstalledCli(['-e', 'console.log("plain text")'])).rejects.toThrow(/invalid JSON/);
  await expect(executeInstalledCli(['-e', 'console.log("{}")'])).rejects.toThrow(/unsupported result/);
});

test('reports a missing CLI binary separately from rejected input', async () => {
  process.env.BITBADGES_CLI_PATH = '/nonexistent/bitbadges-cli';
  await expect(executeInstalledCli(['subscriptions', 'list'])).rejects.toThrow(/not installed or not executable \(ENOENT\)/);
});
