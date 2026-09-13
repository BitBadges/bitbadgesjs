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
  await expect(executeInstalledCli(['-e', 'console.error("private diagnostic");process.exit(1)'])).rejects.toThrow(/CLI action unavailable/);
  await expect(executeInstalledCli(['-e', 'console.log("plain text")'])).rejects.toThrow(/invalid JSON/);
  await expect(executeInstalledCli(['-e', 'console.log("{}")'])).rejects.toThrow(/unsupported result/);
});
