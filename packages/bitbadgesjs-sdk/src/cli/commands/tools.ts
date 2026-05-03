import { Command } from 'commander';
import { toolRegistry, listTools } from '../../builder/tools/registry.js';

export const toolsCommand = new Command('tools')
  .description('List every fine-grained builder tool with its JSON schema. Use `tool <name>` to invoke one.')
  .option('--names', 'Print only tool names, one per line')
  .action((opts: { names?: boolean }) => {
    if (opts.names) {
      for (const name of Object.keys(toolRegistry)) {
        process.stdout.write(`${name}\n`);
      }
      return;
    }
    process.stdout.write(JSON.stringify(listTools(), null, 2) + '\n');
  });
