import { handleBuildDynamicStore, type BuildDynamicStoreInput } from './buildDynamicStore.js';

describe('dynamic store transaction fees', () => {
  const creator = '0x1111111111111111111111111111111111111111';
  it.each<BuildDynamicStoreInput['action']>(['create', 'update', 'delete', 'set_value', 'batch_set_values'])('%s prices the entire gas limit', (action) => {
    const result = handleBuildDynamicStore({ action, creator, defaultValue: false, storeId: '1', address: creator, value: true, entries: [{ address: creator, value: true }] });
    expect(result.success).toBe(true);
    const fee = result.transaction!.fee;
    expect(fee.amount).toEqual([{ denom: 'ubadge', amount: String(BigInt(fee.gas) * 10n) }]);
  });
});
