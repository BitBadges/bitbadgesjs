import { Command, Option } from 'commander';

/**
 * Shell completion script generator for the BitBadges CLI.
 *
 * The v1 generator emitted a flat case-statement covering only top-level
 * commands and their immediate children — anything deeper than two levels
 * (`bb auctions create --...`, `bb dev tools call ...`) got no completion,
 * and flag values (`--network mainnet|testnet|local`) were never offered.
 *
 * v2 walks the full Commander tree and emits a pure-bash script that:
 *   1. Builds a "path key" from COMP_WORDS, skipping flag tokens.
 *   2. Looks up that path in a generated nested case-statement.
 *   3. Suggests:
 *        - subcommand names if the cursor is on a fresh word,
 *        - flag names if the word starts with `-`,
 *        - flag values for enum-like options (`--shell bash|zsh`,
 *          `--network mainnet|testnet|local`, etc) inferred from the
 *          Commander Option's `argChoices`.
 *   4. Falls back to bash's default file completion for path-shaped
 *      flag values (`--output-file <path>`, `--metadata-file <path>`).
 *
 * No external dependencies — the emitted script is portable bash that
 * works in zsh after `bashcompinit`.
 */

interface OptionInfo {
  flags: string[];
  /** Long form without leading dashes, e.g. "output-file". */
  longName: string;
  takesValue: boolean;
  choices?: readonly string[];
  isPath: boolean;
}

interface CommandNode {
  /** Path key including parent names, space-separated; root is "". */
  key: string;
  /** Visible (non-hidden) subcommand names. */
  subs: string[];
  options: OptionInfo[];
}

const PATH_HINT_RE = /(file|path|dir|directory|out|output|config|metadata)$/i;

function extractOptions(cmd: Command): OptionInfo[] {
  return cmd.options.map((o) => {
    const opt = o as Option;
    const longName = (opt.long ?? '').replace(/^--/, '');
    const takesValue = !!opt.required || !!opt.optional;
    return {
      flags: [opt.short, opt.long].filter(Boolean) as string[],
      longName,
      takesValue,
      choices: (opt as any).argChoices ?? undefined,
      isPath: takesValue && PATH_HINT_RE.test(longName),
    };
  });
}

function collectNodes(cmd: Command, parentKey: string, out: CommandNode[]): void {
  const key = parentKey ? `${parentKey} ${cmd.name()}` : cmd.name();
  const visibleSubs = cmd.commands
    .filter((c) => !(c as any)._hidden)
    .map((c) => c.name());
  out.push({ key, subs: visibleSubs, options: extractOptions(cmd) });
  for (const sub of cmd.commands) {
    if (!(sub as any)._hidden) collectNodes(sub, key, out);
  }
}

function shellQuote(s: string): string {
  // Wrap in single quotes; escape embedded single quotes the usual bash way.
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function renderNodeCase(node: CommandNode): string {
  // For each node we emit one case branch that handles:
  //   - flag-value completion driven by $prev
  //   - flag-name completion when $cur starts with `-`
  //   - subcommand completion otherwise
  const flagValueBranches: string[] = [];
  for (const opt of node.options) {
    if (!opt.takesValue) continue;
    if (opt.choices && opt.choices.length > 0) {
      for (const flag of opt.flags) {
        const choices = opt.choices.join(' ');
        flagValueBranches.push(
          `      ${flag}) COMPREPLY=( $(compgen -W ${shellQuote(choices)} -- "$cur") ); return ;;`
        );
      }
    } else if (opt.isPath) {
      for (const flag of opt.flags) {
        flagValueBranches.push(`      ${flag}) COMPREPLY=( $(compgen -f -- "$cur") ); return ;;`);
      }
    }
  }
  const allFlags = node.options.flatMap((o) => o.flags).join(' ');
  const allSubs = node.subs.join(' ');
  const lines: string[] = [];
  lines.push(`    ${shellQuote(node.key)})`);
  if (flagValueBranches.length > 0) {
    lines.push('      case "$prev" in');
    for (const b of flagValueBranches) lines.push(b);
    lines.push('      esac');
  }
  lines.push('      if [[ "$cur" == -* ]]; then');
  lines.push(`        COMPREPLY=( $(compgen -W ${shellQuote(allFlags)} -- "$cur") )`);
  lines.push('      else');
  lines.push(`        COMPREPLY=( $(compgen -W ${shellQuote(allSubs)} -- "$cur") )`);
  lines.push('      fi');
  lines.push('      return ;;');
  return lines.join('\n');
}

export function makeCompletionCommand(program: Command): Command {
  return new Command('completion')
    .description('Generate a bash/zsh completion script. Pipe into your shell rc file.')
    .argument('[shell]', 'Optional shell hint: bash | zsh. The emitted script supports both via bashcompinit.')
    .action((shell?: string) => {
      if (shell && !['bash', 'zsh'].includes(shell.toLowerCase())) {
        process.stderr.write(`Unknown shell "${shell}". Supported: bash, zsh.\n`);
        process.exit(2);
      }
      const nodes: CommandNode[] = [];
      // Strip the program's own name from each node key. COMP_WORDS[0]
      // may be `bitbadges-cli`, `bb`, or any other symlink alias the
      // user installed — instead of binding the case keys to one name,
      // we emit them rooted at subcommand level (e.g. "auctions create"
      // instead of "bitbadges-cli auctions create") and prepend the
      // user's actual invocation name at runtime is unnecessary.
      collectNodes(program, '', nodes);
      const rootName = program.name();
      for (const n of nodes) {
        if (n.key === rootName) n.key = '';
        else if (n.key.startsWith(`${rootName} `)) n.key = n.key.slice(rootName.length + 1);
      }

      // Reverse-sort by key length so deeper paths match before their
      // prefixes when emitted into one case block — bash case picks the
      // first match, and a longer key is more specific.
      nodes.sort((a, b) => b.key.length - a.key.length);

      const caseBranches = nodes.map(renderNodeCase).join('\n');

      const script = `# bitbadges-cli completion — bash & zsh (via bashcompinit)
# Install:
#   bb completion bash >> ~/.bashrc
#   bb completion zsh  >> ~/.zshrc      (then: autoload -U +X bashcompinit && bashcompinit)

_bitbadges_cli_complete() {
  local cur prev key i w
  local -a path
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # Reconstruct the resolved command path by walking COMP_WORDS,
  # skipping flag tokens. Drop COMP_WORDS[0] (the binary name) so the
  # case keys below are binary-agnostic — works for \`bb\`, \`bitbadges-cli\`,
  # or any symlink the user installed.
  path=()
  for (( i=1; i<COMP_CWORD; i++ )); do
    w="\${COMP_WORDS[i]}"
    case "$w" in
      -*) continue ;;
    esac
    path+=( "$w" )
  done
  key="\${path[*]}"

  case "$key" in
${caseBranches}
  esac
}

complete -F _bitbadges_cli_complete bitbadges-cli
complete -F _bitbadges_cli_complete bb
`;

      process.stdout.write(script);
    });
}
