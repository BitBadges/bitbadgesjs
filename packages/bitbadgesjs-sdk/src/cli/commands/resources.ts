import { Command } from 'commander';
import {
  resourceRegistry,
  listResources,
  readResource
} from '../../builder/tools/registry.js';
import { addOutputOptions, emit } from '../utils/envelope.js';

export const resourcesCommand = new Command('resources')
  .description('Read static builder resources (token registry, recipes, skills, docs, error patterns, ...).');

addOutputOptions(
  resourcesCommand
    .command('list')
    .description('List every resource with its metadata as JSON.')
    .option('--uris', 'Surface only resource URIs in envelope.data.uris (one entry per resource)')
).action((opts: { uris?: boolean; condensed?: boolean; outputFile?: string }) => {
  if (opts.uris) {
    emit({ uris: Object.keys(resourceRegistry) }, opts);
    return;
  }
  emit({ resources: listResources() }, opts);
});

addOutputOptions(
  resourcesCommand
    .command('read <uri>')
    .description('Read a resource body by URI (e.g. bitbadges://recipes/all). The body text lives at envelope.data.text.')
).action((uri: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const result = readResource(uri);
  emit({ uri, text: result.text, isError: !!result.isError }, opts);
  if (result.isError) process.exitCode = 1;
});
