import { Command } from 'commander';
import { toolRegistry, listTools } from '../../builder/tools/registry.js';
import { addOutputOptions, emit } from '../utils/envelope.js';

export const toolsCommand = addOutputOptions(
  new Command('tools')
    .description('List every fine-grained builder tool with its JSON schema. Use `tool <name>` to invoke one.')
    .option('--names', 'Surface only tool names in envelope.data.names (one entry per tool)')
).action((opts: { names?: boolean; condensed?: boolean; outputFile?: string }) => {
  if (opts.names) {
    emit({ names: Object.keys(toolRegistry) }, opts);
    return;
  }
  emit({ tools: listTools() }, opts);
});
