import { Command } from 'commander';
import { getAllSkillInstructions, getSkillInstructions } from '../../builder/resources/skillInstructions.js';
import { addOutputOptions, emit, emitError, type EmitOptions } from '../utils/envelope.js';

export const skillsCommand = addOutputOptions(new Command('skills'))
  .description('List or read the skills bundled with this installed CLI. Works offline.')
  .argument('[skillId]', 'Specific skill id (e.g. "smart-token"). Omit to list all skills.')
  .action((skillId: string | undefined, opts: EmitOptions) => {
    if (!skillId) {
      emit(
        getAllSkillInstructions().map(({ instructions: _instructions, ...summary }) => summary),
        opts
      );
      return;
    }
    const skill = getSkillInstructions(skillId);
    if (!skill) {
      emitError(new Error(`Unknown skill: ${skillId}`), {
        ...opts,
        code: 'invalid_input',
        hint: 'Run bb dev skills to list available skill IDs.'
      });
    }
    emit(skill, opts);
  });
