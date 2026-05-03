import { Command } from 'commander';
import { docsCommand } from './docs.js';

export const skillsCommand = new Command('skills')
  .description('Shorthand for "docs builder-skills" — list or show BitBadges Builder skills.')
  .argument('[skillId]', 'Specific skill id (e.g. "smart-token"). Omit to list all skills.')
  .addHelpText('after', '\nEquivalent to: docs builder-skills / docs builder-skills/<id>')
  .action(async (skillId: string | undefined) => {
    // Delegate to the docs command. The slug must exist in the loaded
    // docs tree — coordinated with bitbadges-docs where this section is
    // published.
    const section = skillId ? `builder-skills/${skillId}` : 'builder-skills';
    await docsCommand.parseAsync(['node', 'docs', section]);
  });
