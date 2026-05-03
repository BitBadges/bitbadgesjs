import { Command } from 'commander';

/**
 * Build a bash/zsh completion script for whichever Commander program is
 * passed in. Walks the program's top-level commands and their immediate
 * subcommands so completions stay accurate after the command tree
 * changes — no hand-maintained list.
 */
export function makeCompletionCommand(program: Command): Command {
  return new Command('completion')
    .description('Generate shell completion script (bash/zsh).')
    .action(() => {
      const topLevelNames = program.commands.map((c) => c.name()).join(' ');

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
}
