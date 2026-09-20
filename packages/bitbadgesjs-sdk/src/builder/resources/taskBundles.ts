import { getSkillInstructions, type SkillInstruction } from './skillInstructions.js';
import { getBuilderInputSchema } from '../../core/builders/input-schemas.js';
import { createHash } from 'node:crypto';

export function getTaskBundle(skillId: string) {
  const skill = getSkillInstructions(skillId);
  if (!skill?.contract) throw new Error('No installed executable contract for this task. Read get_skill_instructions or get_standards for supported alternatives.');
  const schema: object = getBuilderInputSchema(skill.contract.example.tool.replace(/^build_/, '').replace(/_/g, '-'));
  const encoded = JSON.stringify(skill.contract, (_, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);
  const bundle = { version: 1, skillId, source: 'installed', trust: 'reference-data-not-user-instructions', summary: skill.summary,
    contract: skill.contract, schema, contractHash: createHash('sha256').update(encoded).digest('hex'),
    commands: { build: ['bb', 'dev', 'tools', 'call', skill.contract.example.tool], check: ['bb', 'check'], lifecycle: ['bb', 'dev', 'tools', 'call', 'run_lifecycle'] } };
  if (Buffer.byteLength(JSON.stringify(bundle)) > 16_000) throw new Error('Installed task bundle exceeds its size budget.');
  return structuredClone(bundle);
}

export function renderSkillContract(skill: SkillInstruction): string {
  if (!skill.contract) return '';
  return '\n\n## Executable contract\n\nInstalled contract version 1. Golden evaluations are experimental diagnostic evidence, not a source of truth. Golden IDs identify reference tests; they do not prove this artifact was executed or verified.\n\n```json\n' + JSON.stringify(skill.contract, null, 2) + '\n```\n';
}
