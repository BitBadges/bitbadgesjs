#!/usr/bin/env node
import { Command } from 'commander';

// Build & ship a transaction
import { buildCommand } from './commands/build.js';
import { toolsCommand } from './commands/tools.js';
import { toolCommand } from './commands/tool.js';
import { checkCommand } from './commands/check.js';
import { explainCommand } from './commands/explain.js';
import { simulateCommand } from './commands/simulate.js';
import { previewCommand } from './commands/preview.js';
import { deployCommand } from './commands/deploy.js';
import { txCommand } from './commands/tx.js';
import { signWithBrowserCommand } from './commands/sign-with-browser.js';
import { genTxPayloadCommand } from './commands/gen-tx-payload.js';

// Indexer access
import { createApiCommand } from './commands/api.js';
import { authCommand } from './commands/auth.js';

// Local state
import { configCommand } from './commands/config.js';
import { burnerCommand } from './commands/burner.js';
import { sessionCommand } from './commands/session.js';

// Discovery
import { docsCommand } from './commands/docs.js';
import { skillsCommand } from './commands/skills.js';
import { resourcesCommand } from './commands/resources.js';
import { doctorCommand } from './commands/doctor.js';

// Address & lookup utilities
import { addressCommand } from './commands/address.js';
import { aliasCommand } from './commands/alias.js';
import { lookupCommand } from './commands/lookup.js';
import { genListIdCommand } from './commands/gen-list-id.js';

// Misc
import { makeCompletionCommand } from './commands/completion.js';

const program = new Command();

program
  .name('bitbadges-cli')
  .description('BitBadges CLI — flat verb-first surface for building, inspecting, and shipping token transactions')
  .version('0.1.0');

// ── Global options ───────────────────────────────────────────────────────────
//
// --help-json is parsed below by inspecting argv directly (Commander
// emits it as a global option).
//
// --quiet is a hint to per-command stderr commentary helpers; the actual
// gate is `BB_QUIET=1` env var which Commander forwards to every action.
// We propagate the flag into the env var so utilities anywhere can call
// `isQuiet()` without reading commander state.

program.option('--help-json', 'Output all commands as structured JSON (for LLMs)');
program.option('--quiet', 'Silence stderr commentary (auto-review banners, "Written to" notices, etc). Errors still emit. Equivalent to BB_QUIET=1.');

if (process.argv.includes('--quiet')) {
  process.env.BB_QUIET = '1';
}

// ── Help groups ──────────────────────────────────────────────────────────────
//
// The command tree is intentionally flat — no `sdk` / `builder` umbrella
// nouns. Discovery via `--help` would otherwise be a wall of ~20 verbs, so
// we attach a `helpGroup` tag to each command and emit a sectioned
// after-help block. Tree shape stays flat; help layout stays organized.

const HELP_GROUPS: { title: string; commands: Command[] }[] = [
  {
    title: 'Build & ship a transaction',
    commands: [buildCommand, toolsCommand, toolCommand, checkCommand, explainCommand, simulateCommand, previewCommand, genTxPayloadCommand, deployCommand, txCommand]
  },
  {
    title: 'Indexer access',
    commands: [createApiCommand(), authCommand, signWithBrowserCommand]
  },
  {
    title: 'Local state',
    commands: [configCommand, burnerCommand, sessionCommand]
  },
  {
    title: 'Discovery',
    commands: [docsCommand, skillsCommand, resourcesCommand, doctorCommand]
  },
  {
    title: 'Address & lookup utilities',
    commands: [addressCommand, aliasCommand, lookupCommand, genListIdCommand]
  }
];

const completionCommand = makeCompletionCommand(program);
HELP_GROUPS.push({ title: 'Misc', commands: [completionCommand] });

// ── Register every command at the top level ─────────────────────────────────

for (const group of HELP_GROUPS) {
  for (const cmd of group.commands) {
    program.addCommand(cmd);
  }
}

// ── Grouped --help override ─────────────────────────────────────────────────
//
// Commander's default help lumps every command into one alphabetized list.
// Override the formatter so commands appear under their group heading,
// and the group sequence matches our verb pipeline (build → check →
// deploy) rather than alphabet.

// Grouped help: emit a sectioned "Commands:" block on the root --help.
// Commander's default formatter produces one alphabetized list — since we
// have ~20 verbs at the top level, that's a wall of text. Override only
// the root formatter; subcommand help still uses the default flat layout.
program.configureHelp({
  formatHelp: (cmd, helper) => {
    const isRoot = cmd === program;
    if (!isRoot) {
      // Defer to the default formatter for non-root commands.
      // Commander's Help class exposes a default formatHelp via the same
      // `helper` instance — but configureHelp replaced ours, so we need
      // to assemble it manually for subcommands. The minimal version is
      // good enough since auth/burner/etc all have their own
      // addHelpText() blocks where they want richer output.
      return defaultFormatHelp(cmd, helper);
    }

    const sections: string[] = [];
    sections.push(`Usage: ${helper.commandUsage(cmd)}`);
    const desc = helper.commandDescription(cmd);
    if (desc) sections.push('', desc);

    const optList = helper.visibleOptions(cmd);
    if (optList.length > 0) {
      sections.push('', 'Options:');
      for (const opt of optList) {
        sections.push(`  ${helper.optionTerm(opt).padEnd(28)}  ${helper.optionDescription(opt)}`);
      }
    }

    const visibleByName = new Map<string, Command>();
    for (const c of helper.visibleCommands(cmd)) visibleByName.set(c.name(), c);

    sections.push('', 'Commands:');
    for (const group of HELP_GROUPS) {
      const groupVisible = group.commands.filter((c) => visibleByName.has(c.name()));
      if (groupVisible.length === 0) continue;
      sections.push('', `  ${group.title}:`);
      for (const c of groupVisible) {
        sections.push(`    ${helper.subcommandTerm(c).padEnd(28)}  ${helper.subcommandDescription(c)}`);
      }
    }

    return sections.join('\n') + '\n';
  }
});

function defaultFormatHelp(cmd: Command, helper: any): string {
  // Minimal flat formatter for non-root commands. Commander's stock
  // implementation pads more carefully but the visible difference is
  // negligible for our subcommands.
  const sections: string[] = [];
  sections.push(`Usage: ${helper.commandUsage(cmd)}`);
  const desc = helper.commandDescription(cmd);
  if (desc) sections.push('', desc);

  const argList = helper.visibleArguments(cmd);
  if (argList.length > 0) {
    sections.push('', 'Arguments:');
    for (const arg of argList) {
      sections.push(`  ${helper.argumentTerm(arg).padEnd(28)}  ${helper.argumentDescription(arg)}`);
    }
  }

  const optList = helper.visibleOptions(cmd);
  if (optList.length > 0) {
    sections.push('', 'Options:');
    for (const opt of optList) {
      sections.push(`  ${helper.optionTerm(opt).padEnd(28)}  ${helper.optionDescription(opt)}`);
    }
  }

  const subList = helper.visibleCommands(cmd);
  if (subList.length > 0) {
    sections.push('', 'Commands:');
    for (const sub of subList) {
      sections.push(`  ${helper.subcommandTerm(sub).padEnd(28)}  ${helper.subcommandDescription(sub)}`);
    }
  }

  return sections.join('\n') + '\n';
}

// ── --help-json handler ─────────────────────────────────────────────────────

function extractCommandTree(cmd: Command): any {
  const args = (cmd as any)._args?.map((a: any) => ({
    name: a.name(),
    required: a.required,
    description: a.description
  })) || [];

  const options = cmd.options.map((o: any) => ({
    flags: o.flags,
    description: o.description,
    defaultValue: o.defaultValue
  }));

  const subcommands = cmd.commands.map((sub: Command) => extractCommandTree(sub));

  return {
    name: cmd.name(),
    description: cmd.description(),
    ...(args.length > 0 ? { arguments: args } : {}),
    ...(options.length > 0 ? { options } : {}),
    ...(subcommands.length > 0 ? { subcommands } : {})
  };
}

if (process.argv.includes('--help-json')) {
  const tree = {
    commands: program.commands.map((cmd) => extractCommandTree(cmd))
  };
  process.stdout.write(JSON.stringify(tree, null, 2) + '\n');
  process.exit(0);
}

program.parse();
