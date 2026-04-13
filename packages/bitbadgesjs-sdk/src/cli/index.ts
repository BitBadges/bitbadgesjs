#!/usr/bin/env node
import { Command } from 'commander';
import { sdkCommand } from './commands/sdk.js';
import { createApiCommand } from './commands/api.js';
import { configCommand } from './commands/config.js';
import { buildCommand } from './commands/build.js';
import { mcpCommand } from './commands/mcp.js';

const program = new Command();

program.name('bitbadges-cli').description('BitBadges CLI — SDK utilities and indexer API commands').version('0.1.0');

// ── Global option: --help-json ───────────────────────────────────────────────

program.option('--help-json', 'Output all commands as structured JSON (for LLMs)');

// ── Register commands ────────────────────────────────────────────────────────

program.addCommand(sdkCommand);
program.addCommand(createApiCommand());
program.addCommand(configCommand);
program.addCommand(buildCommand);
program.addCommand(mcpCommand);

// ── completion command ───────────────────────────────────────────────────────

program
  .command('completion')
  .description('Generate shell completion script (bash/zsh)')
  .action(() => {
    const topLevelNames = program.commands.map((c) => c.name()).join(' ');

    // Gather second-level subcommands
    const caseEntries = program.commands
      .map((cmd) => {
        const subs = cmd.commands?.map((s: any) => s.name()).join(' ');
        if (!subs) return null;
        return `      ${cmd.name()}) COMPREPLY=( $(compgen -W "${subs}" -- "$cur") ) ;;`;
      })
      .filter(Boolean)
      .join('\n');

    const script = `
# bitbadges-cli completion — add to your .bashrc / .zshrc:
#   eval "$(bitbadges-cli completion)"

_bitbadges_cli_completions() {
  local cur prev
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${topLevelNames}" -- "$cur") )
    return
  fi

  case "$prev" in
${caseEntries}
  esac
}

complete -F _bitbadges_cli_completions bitbadges-cli

# For zsh, also add:
# autoload -U +X bashcompinit && bashcompinit
`.trimStart();

    process.stdout.write(script);
  });

// ── --help-json handler ──────────────────────────────────────────────────────

function extractCommandTree(cmd: Command): any {
  const args = (cmd as any)._args?.map((a: any) => ({
    name: a.name(),
    required: a.required,
    description: a.description,
  })) || [];

  const options = cmd.options.map((o: any) => ({
    flags: o.flags,
    description: o.description,
    defaultValue: o.defaultValue,
  }));

  const subcommands = cmd.commands.map((sub: Command) => extractCommandTree(sub));

  return {
    name: cmd.name(),
    description: cmd.description(),
    ...(args.length > 0 ? { arguments: args } : {}),
    ...(options.length > 0 ? { options } : {}),
    ...(subcommands.length > 0 ? { subcommands } : {}),
  };
}

// ── Parse ────────────────────────────────────────────────────────────────────

// Check for --help-json before commander parses (so it works as a global flag)
if (process.argv.includes('--help-json')) {
  const tree = {
    commands: program.commands.map((cmd) => extractCommandTree(cmd)),
  };
  process.stdout.write(JSON.stringify(tree, null, 2) + '\n');
  process.exit(0);
}

program.parse();
