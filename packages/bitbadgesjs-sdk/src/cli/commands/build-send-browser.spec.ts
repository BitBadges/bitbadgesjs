import { buildCommand } from './build.js';
import { executeDeploy } from '../utils/deploy-options.js';

jest.mock('../utils/deploy-options.js', () => ({ ...jest.requireActual('../utils/deploy-options.js'), executeDeploy: jest.fn() }));
jest.mock('../utils/envelope.js', () => ({ ...jest.requireActual('../utils/envelope.js'), emit: jest.fn() }));
const sender = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
const recipient = 'bb1py4mfpg6uf59qkyzg0nmau322c5873eeysp5ue';

test('send --browser binds --from and awaits the signing handoff', async () => {
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { entered = resolve; });
  (executeDeploy as jest.Mock).mockImplementationOnce(async () => { entered(); await gate; });
  let completed = false;
  const command = buildCommand.parseAsync(['send', '--from', sender, '--to', recipient, '--amount', '5', '--denom', 'ubadge', '--browser', '--json-only'], { from: 'user' }).then(() => { completed = true; });
  try {
    await started;
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(executeDeploy).toHaveBeenCalledWith(expect.objectContaining({ value: { fromAddress: sender, toAddress: recipient, amount: [{ denom: 'ubadge', amount: '5' }] } }), expect.anything(), { expectedAddress: sender });
    expect(completed).toBe(false);
  } finally {
    release();
    await command;
  }
});
