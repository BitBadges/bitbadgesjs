import { createStandardActionTools } from './standardActions.js';

test('standard actions expose business inputs but no signing, shell, credential or file controls', async () => {
  const execute = jest.fn();
  const tools = createStandardActionTools(execute, () => 'catalog');
  expect(Object.keys(tools).length).toBeGreaterThan(40);
  const pay = tools.standard_pay_requests_pay;
  expect(pay.tool.inputSchema.required).toEqual(expect.arrayContaining(['creator', 'collectionId']));
  expect(pay.tool.inputSchema.properties).toHaveProperty('obligation');
  for (const key of ['browser', 'burner', 'exec', 'shell', 'apiKey', 'outputFile', 'url']) {
    await expect(pay.run({ collectionId: '1', creator: 'payer', [key]: true })).rejects.toThrow();
  }
  expect(execute).not.toHaveBeenCalled();
});

test('executes the documented CLI action with literal values and checks the installed catalog', async () => {
  const execute = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, data: { catalogHash: 'catalog' } })
    .mockResolvedValueOnce({ ok: true, data: { typeUrl: '/tokenization.MsgTransferTokens', value: {} }, warnings: [] });
  const tools = createStandardActionTools(execute, () => 'catalog');
  await expect(
    tools.standard_pay_requests_pay.run({ collectionId: '--browser', creator: 'payer', obligation: '$(example)', units: '1', mainnet: true })
  ).resolves.toMatchObject({ ok: true });
  expect(execute.mock.calls[0][0]).toEqual(['dev', 'capabilities']);
  const argv = execute.mock.calls[1][0];
  expect(argv.slice(0, 2)).toEqual(['pay-requests', 'pay']);
  expect(argv).toContain('--obligation=$(example)');
  expect(argv.slice(-2)).toEqual(['--', '--browser']);
  expect(argv).toContain('--mainnet');
});

test('rejects mismatched CLI versions before querying payment state and preserves action failures', async () => {
  const execute = jest.fn().mockResolvedValue({ ok: true, data: { catalogHash: 'older' } });
  const tools = createStandardActionTools(execute, () => 'current');
  await expect(tools.standard_subscriptions_claim.run({ collectionId: '1', creator: 'payer' })).rejects.toThrow(/same.*installation|catalog/i);
  expect(execute).toHaveBeenCalledTimes(1);
  execute
    .mockReset()
    .mockResolvedValueOnce({ ok: true, data: { catalogHash: 'current' } })
    .mockResolvedValueOnce({ ok: false, error: { code: 'not_found', message: 'Collection missing' } });
  await expect(tools.standard_subscriptions_claim.run({ collectionId: '1', creator: 'payer' })).resolves.toMatchObject({ ok: false });
});

test('rejects incompatible networks and missing business fields before invoking the CLI', async () => {
  const execute = jest.fn();
  const tools = createStandardActionTools(execute, () => 'catalog');
  await expect(tools.standard_subscriptions_status.run({ collectionId: '1' })).rejects.toThrow();
  await expect(tools.standard_pay_requests_pay.run({ collectionId: '1', creator: 'payer', mainnet: true, testnet: true })).rejects.toThrow();
  expect(execute).not.toHaveBeenCalled();
});

test('renewal changes require both tiers and expose the same CLI proposal', async () => {
  const execute = jest.fn().mockResolvedValueOnce({ ok: true, data: { catalogHash: 'catalog' } }).mockResolvedValueOnce({ ok: true, data: { messages: [], renewalChange: { effectiveAt: '1000' } } });
  const tools = createStandardActionTools(execute, () => 'catalog');
  await expect(tools.standard_subscriptions_change_renewal.run({ collectionId: '1', creator: 'payer', tier: 'old' })).rejects.toThrow();
  await expect(tools.standard_subscriptions_change_renewal.run({ collectionId: '1', creator: 'payer', tier: 'old', toTier: 'new' })).resolves.toMatchObject({ ok: true });
  expect(execute.mock.calls[1][0]).toEqual(expect.arrayContaining(['subscriptions', 'change-renewal', '--to-tier=new']));
});

test('spendable purchase tools expose explicit tier selection', () => {
  const tools = createStandardActionTools(jest.fn(), () => 'catalog');
  expect(tools.standard_spendable_credits_purchase.tool.inputSchema.properties).toHaveProperty('approvalId');
});

test('spendable quote exposes unsigned exact tier selection through MCP', async () => {
  const execute = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, data: { catalogHash: 'catalog' } })
    .mockResolvedValueOnce({ ok: true, data: { paymentAmount: '20', creditsAmount: '6' } });
  const tools = createStandardActionTools(execute, () => 'catalog');
  expect(tools.standard_spendable_credits_quote.tool.inputSchema.required).toContain('units');
  await tools.standard_spendable_credits_quote.run({ collectionId: '3', units: '2', approvalId: 'spendable-purchase-2' });
  expect(execute.mock.calls[1][0]).toContain('--approval-id=spendable-purchase-2');
  expect(execute.mock.calls[1][0].slice(0, 2)).toEqual(['spendable-credits', 'quote']);
});

 test('operator subscriptions expose all quote, period, consent and unsigned acceptance actions',async()=>{
 const execute=jest.fn().mockResolvedValue({ok:true,data:{catalogHash:'catalog'}});const tools=createStandardActionTools(execute,()=> 'catalog');
 for(const action of ['config','quote','quote_status','periods','accept','record_submission','renewal','cancel_renewal'])expect(tools).toHaveProperty(`standard_subscriptions_${action}`);
 const accept=tools.standard_subscriptions_accept;
 expect(accept.tool.inputSchema.properties).toHaveProperty('withSession');
 for(const key of ['rpc','lcd','url','apiKey'])expect(accept.tool.inputSchema.properties).not.toHaveProperty(key);
 await tools.standard_subscriptions_quote.run({collectionId:'1',creator:'payer',withSession:true,kind:'upgrade',tokenId:'2',requestId:'stable'});
 expect(execute.mock.calls[1][0]).toEqual(expect.arrayContaining(['subscriptions','quote','--with-session','--kind=upgrade','--token-id=2']));
 });

test('membership actions expose explicit Manager and member inputs',()=>{const tools=createStandardActionTools(jest.fn(),()=> 'catalog');for(const action of ['add','remove'])expect(tools[`standard_address_lists_${action}`].tool.inputSchema.required).toEqual(expect.arrayContaining(['collectionId','creator','address']));});
