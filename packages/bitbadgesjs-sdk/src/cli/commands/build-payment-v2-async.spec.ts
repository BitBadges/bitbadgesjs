import { buildCommand } from './build.js';
import { executeDeploy } from '../utils/deploy-options.js';
import { emit } from '../utils/envelope.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';

jest.mock('../utils/deploy-options.js', () => ({ ...jest.requireActual('../utils/deploy-options.js'), executeDeploy: jest.fn() }));
jest.mock('../utils/envelope.js', () => ({ ...jest.requireActual('../utils/envelope.js'), emit: jest.fn() }));

const recipient = convertToBitBadgesAddress('0x3333333333333333333333333333333333333333');
const params = {
  version: 2,
  kind: 'invoice',
  uri: 'https://example.com/invoice.json',
  obligations: [{ id: 'one', payer: { kind: 'anyone' }, payouts: [{ recipient, denom: 'ubadge', amount: '10' }], startTime: '1', endTime: '100' }]
};
const invoke = () => buildCommand.parseAsync(['payment-request-v2', '--json', JSON.stringify(params), '--json-only', '--burner'], { from: 'user' });

beforeEach(() => jest.clearAllMocks());

describe('payment V2 build pipeline completion', () => {
  it('waits for the shared deploy pipeline before resolving command completion', async () => {
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    (executeDeploy as jest.Mock).mockImplementationOnce(async () => {
      entered();
      await gate;
    });
    let completed = false;
    const command = invoke().then(() => {
      completed = true;
    });
    try {
      await started;
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(emit).toHaveBeenCalledTimes(1);
      expect(completed).toBe(false);
    } finally {
      release();
      await command;
    }
    expect(completed).toBe(true);
  });

  it('propagates a shared pipeline rejection through Commander parseAsync', async () => {
    const failure = new Error('Local test deployment adapter unavailable');
    (executeDeploy as jest.Mock).mockRejectedValueOnce(failure);
    await expect(invoke()).rejects.toBe(failure);
    expect(executeDeploy).toHaveBeenCalledTimes(1);
  });
});
