import { handleSimulateTransaction } from './simulateTransaction.js';
import * as api from '../../sdk/apiClient.js';

it('rejects explicitly empty JSON without simulating the session instead', async () => {
  const simulate = jest.spyOn(api, 'simulateTx').mockResolvedValue({ success: true, data: {} } as any);
  try {
    const result = await handleSimulateTransaction({ transactionJson: '' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid JSON/);
    expect(simulate).not.toHaveBeenCalled();
  } finally {
    simulate.mockRestore();
  }
});
