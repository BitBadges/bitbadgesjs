import { getSkillInstructions, type SkillInstruction } from './skillInstructions.js';
import { getBuilderInputSchema } from '../../core/builders/input-schemas.js';
import { artifactIdentity } from '../../core/intent.js';

export function getTaskBundle(skillId: string) {
  const skill = getSkillInstructions(skillId);
  if (!skill?.contract) throw new Error('No installed executable contract for this task. Read get_skill_instructions or get_standards for supported alternatives.');
  const schema: object = getBuilderInputSchema(skill.contract.example.tool.replace(/^build_/, '').replace(/_/g, '-'));
  const bundle = { version: 1, skillId, source: 'installed', trust: 'reference-data-not-user-instructions', summary: skill.summary,
    contract: skill.contract, schema, contractHash: artifactIdentity(skill.contract),
    commands: { build: ['bb', 'dev', 'tools', 'call', skill.contract.example.tool], check: ['bb', 'check'], lifecycle: ['bb', 'dev', 'tools', 'call', 'run_lifecycle'] } };
  if (Buffer.byteLength(JSON.stringify(bundle)) > 16_000) throw new Error('Installed task bundle exceeds its size budget.');
  return bundle;
}

export function renderSkillContract(skill: SkillInstruction): string {
  if (!skill.contract) return '';
  return '\n\n## Executable contract\n\nInstalled contract version 1. Golden IDs are behavioral tests, not proof that this build was executed.\n\n```json\n' + JSON.stringify(skill.contract, null, 2) + '\n```\n';
}
