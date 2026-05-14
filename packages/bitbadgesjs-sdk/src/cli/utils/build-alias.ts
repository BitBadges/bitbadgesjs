/**
 * Per-standard `build` alias factory.
 *
 * History: v2 of the CLI (commit 7 of #233) removed the per-standard
 * `<standard> build` subcommand in favor of a single canonical
 * `bb build <type>` family. That gave one obvious place to look but
 * forced users coming from v1 muscle memory (or from the in-app FE)
 * to context-switch when they wanted to build a vault while reading
 * `bb smart-tokens --help`. This factory restores the per-standard
 * alias as a thin delegate — invoking it forwards every arg to the
 * canonical `bb build <subtype>` command.
 *
 * Usage: `parent.addCommand(makeBuildAlias('auction', buildCommand))`.
 *
 * Caveats:
 * - `--help` flow is forwarded manually (Commander would otherwise
 *   render help for the alias, which carries no flags of its own).
 * - Errors thrown by the canonical builder are caught and re-emitted
 *   on stderr with exit 1 so the alias surface stays uniform.
 */

import { Command } from 'commander';

export function makeBuildAlias(buildSubtype: string, buildCommand: Command): Command {
  const alias = new Command('build')
    .description(
      `Alias for \`bb build ${buildSubtype}\` — same flags, same output. Provided so muscle memory from in-app builders and v1 surveys keeps working.`
    )
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .helpOption(false)
    .action(async (_opts, cmd) => {
      const sub = buildCommand.commands.find((c) => c.name() === buildSubtype);
      if (!sub) {
        process.stderr.write(`Internal error: \`bb build ${buildSubtype}\` subcommand not registered.\n`);
        process.exit(1);
      }
      // Forward --help to the canonical builder so users see real flags,
      // not the alias's empty help block.
      if (cmd.args.includes('-h') || cmd.args.includes('--help')) {
        sub.help();
        return;
      }
      try {
        await sub.parseAsync(cmd.args, { from: 'user' });
      } catch (err: any) {
        process.stderr.write(`Error: ${err?.message ?? err}\n`);
        process.exit(1);
      }
    });
  return alias;
}
