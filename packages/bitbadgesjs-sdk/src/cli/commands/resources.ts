import { Command } from 'commander';
import {
  resourceRegistry,
  listResources,
  readResource
} from '../../builder/tools/registry.js';

export const resourcesCommand = new Command('resources')
  .description('Read static builder resources (token registry, recipes, skills, docs, error patterns, ...).');

resourcesCommand
  .command('list')
  .description('List every resource with its metadata as JSON.')
  .option('--uris', 'Print only resource URIs, one per line')
  .action((opts: { uris?: boolean }) => {
    if (opts.uris) {
      for (const uri of Object.keys(resourceRegistry)) {
        process.stdout.write(`${uri}\n`);
      }
      return;
    }
    process.stdout.write(JSON.stringify(listResources(), null, 2) + '\n');
  });

resourcesCommand
  .command('read <uri>')
  .description('Read a resource body by URI (e.g. bitbadges://recipes/all).')
  .action((uri: string) => {
    const result = readResource(uri);
    process.stdout.write(result.text + '\n');
    if (result.isError) {
      process.exitCode = 1;
    }
  });
