import { getTaskBundle, renderSkillContract } from './taskBundles.js';
import { getAllSkillInstructions } from './skillInstructions.js';
import { callTool } from '../tools/registry.js';
describe('installed executable skill contracts', () => {
  it.each(['subscription', 'payment-request', 'smart-token', 'credit-token', 'spendable-credit'])('retrieves and executes the bounded %s bundle offline', async skillId => {
    const bundle = getTaskBundle(skillId);
    expect(Buffer.byteLength(JSON.stringify(bundle))).toBeLessThan(16000);
    expect(bundle.contract.goldenScenarioIds.length).toBeGreaterThan(0);
    expect(bundle.contract.clarifications.length).toBeGreaterThan(0);
    const result = await callTool(bundle.contract.example.tool, bundle.contract.example.input);
    expect(result.isError).not.toBe(true);
    expect(result.result.typeUrl).toBe('/tokenization.MsgCreateCollection');
    expect(renderSkillContract(getAllSkillInstructions().find(skill => skill.id === skillId)!)).toContain(bundle.contract.goldenScenarioIds[0]);
    const wrong = await callTool(bundle.contract.example.tool, { ...bundle.contract.example.input, hallucinatedField: 'x' });
    expect(wrong.isError).toBe(true);
  });
  it('does not silently fetch network docs for an unknown task', () => {
    expect(() => getTaskBundle('made-up')).toThrow(/installed/);
  });
});
