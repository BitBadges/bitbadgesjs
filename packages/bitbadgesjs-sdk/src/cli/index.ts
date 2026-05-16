#!/usr/bin/env node
import * as fs from 'node:fs';
import { Command, Help } from 'commander';
import { HELP_GROUP_ORDER } from './utils/help-groups.js';
import { emitDeprecation } from './utils/deprecation.js';

// Apply a custom Help subclass globally so every command + sub-subcommand
// inherits the "Required: / Options:" split, not just the root. Commander
// doesn't inherit `.configureHelp(...)` down the subcommand tree, so for
// deep commands like `bb intents create --help` we need to override at the
// `Help` class level. Defined here so the override is in scope before any
// subcommand is instantiated.
// ── Layout primitives ────────────────────────────────────────────────────────
// TERM_COL: clamp on the term column. A term longer than this drops its
//   description onto the next line, indented to TERM_COL+leftPad, instead
//   of pushing the whole section's descriptions further right.
// HELP_WIDTH: total width budget. Descriptions reflow at this width,
//   re-indented to keep the column alignment intact.
const TERM_COL = 30;
const HELP_WIDTH = Math.max(80, process.stdout.columns ?? 100);

/** Word-wrap `text` to `width` chars, indenting every line (including the
 *  first) by `indent`. Preserves existing line breaks. */
function wrapText(text: string, width: number, indent: string): string {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (!para) { out.push(indent); continue; }
    let line = '';
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      if (line && line.length + 1 + word.length > width) {
        out.push(indent + line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) out.push(indent + line);
  }
  return out.join('\n');
}

/** Render one term/description row with two niceties over Commander's
 *  default `padEnd` + raw concat:
 *   1. If `term` is longer than `termCol`, emit it on its own line and put
 *      the description on the next line, indented to `leftPad + termCol`.
 *      Stops one long term from blowing out the whole section.
 *   2. The description is word-wrapped to fit within HELP_WIDTH and the
 *      continuation lines are re-indented to match the description column.
 */
function renderRow(term: string, description: string, leftPad: number, termCol: number = TERM_COL): string {
  const left = ' '.repeat(leftPad);
  const descIndentLen = leftPad + termCol + 2; // +2 gap between term and desc
  const descIndent = ' '.repeat(descIndentLen);
  const descWidth = Math.max(20, HELP_WIDTH - descIndentLen);
  const wrapped = description ? wrapText(description, descWidth, descIndent) : '';
  if (term.length <= termCol) {
    return wrapped ? `${left}${term.padEnd(termCol)}  ${wrapped.trimStart()}` : `${left}${term}`;
  }
  return wrapped ? `${left}${term}\n${wrapped}` : `${left}${term}`;
}

class GroupedHelp extends Help {

  formatHelp(cmd: Command, helper: Help): string {
    const sections: string[] = [];
    sections.push(`Usage: ${helper.commandUsage(cmd)}`);
    const desc = helper.commandDescription(cmd);
    if (desc) {
      // Wrap the top description to the full help width so long blurbs
      // don't bleed past the terminal edge.
      sections.push('', wrapText(desc, HELP_WIDTH, ''));
    }

    const argList = helper.visibleArguments(cmd);
    if (argList.length > 0) {
      sections.push('', 'Arguments:');
      for (const arg of argList) {
        sections.push(renderRow(helper.argumentTerm(arg), helper.argumentDescription(arg), 2));
      }
    }

    // Split into Required (declared with `.requiredOption(...)`, Commander
    // sets `mandatory = true`) and Options. Within Options, sub-group by
    // `helpGroupHeading` (set via `option.helpGroup(name)`) — per-command
    // flags (no group) render first, then shared categories in
    // HELP_GROUP_ORDER. Keeps command-specific knobs at the top and
    // pushes verbose deploy/builder/network plumbing to the bottom.
    const optList = helper.visibleOptions(cmd);
    const requiredOpts = optList.filter((o: any) => o.mandatory);
    const optionalOpts = optList.filter((o: any) => !o.mandatory);
    if (requiredOpts.length > 0) {
      sections.push('', 'Required:');
      for (const opt of requiredOpts) {
        sections.push(renderRow(helper.optionTerm(opt), helper.optionDescription(opt), 2));
      }
    }
    if (optionalOpts.length > 0) {
      sections.push('', 'Options:');
      const ungrouped: any[] = [];
      const byGroup = new Map<string, any[]>();
      for (const opt of optionalOpts) {
        const g = (opt as any).helpGroupHeading;
        if (!g) { ungrouped.push(opt); continue; }
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g)!.push(opt);
      }
      // Per-command flags first (no subheader)
      for (const opt of ungrouped) {
        sections.push(renderRow(helper.optionTerm(opt), helper.optionDescription(opt), 2));
      }
      const orderedGroups = [
        ...HELP_GROUP_ORDER,
        ...Array.from(byGroup.keys()).filter((g) => !(HELP_GROUP_ORDER as readonly string[]).includes(g))
      ];
      for (const group of orderedGroups) {
        const groupOpts = byGroup.get(group);
        if (!groupOpts || groupOpts.length === 0) continue;
        sections.push('', `  ${group}:`);
        for (const opt of groupOpts) {
          sections.push(renderRow(helper.optionTerm(opt), helper.optionDescription(opt), 4, TERM_COL - 2));
        }
      }
    }

    const subList = helper.visibleCommands(cmd);
    if (subList.length > 0) {
      sections.push('', 'Commands:');
      for (const sub of subList) {
        sections.push(renderRow(helper.subcommandTerm(sub), helper.subcommandDescription(sub), 2));
      }
    }

    return sections.join('\n') + '\n';
  }
}

// Replace Command.prototype.createHelp so every Command — including
// subcommands constructed inside the imports below — picks up GroupedHelp.
// Must run BEFORE any `new Command(...)` calls.
(Command.prototype as any).createHelp = function () {
  return Object.assign(new GroupedHelp(), this.configureHelp());
};

// Build & ship a transaction
import { buildCommand } from './commands/build.js';
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
import { settingsCommand } from './commands/settings.js';
import { burnerCommand } from './commands/burner.js';
import { sessionCommand } from './commands/session.js';

// Discovery
import { doctorCommand } from './commands/doctor.js';

// Dev / agent surface (v2: tools/tool/resources/docs/skills/gen-pub-key)
import { devCommand } from './commands/dev.js';

// Address & lookup utilities
import { amountCommand } from './commands/amount.js';
import { urlCommand } from './commands/url.js';
import { dynamicStoresCommand } from './commands/dynamic-stores.js';
import { accountCommand } from './commands/account.js';
import { makeDeprecatedAlias } from './utils/deprecated-alias.js';

// Swap / DEX
import { swapCommand } from './commands/swap.js';
import { balancesCommand } from './commands/balances.js';
import { priceCommand } from './commands/price.js';
import { assetsCommand } from './commands/assets.js';
import { poolsCommand } from './commands/pools.js';
import { pairsCommand } from './commands/pairs.js';

// Standard-specific end-user surfaces
import { payRequestsCommand } from './commands/pay-requests.js';
import { bountiesCommand } from './commands/bounties.js';
import { subscriptionsCommand } from './commands/subscriptions.js';
import { intentsCommand } from './commands/intents.js';
import { creditTokensCommand } from './commands/credit-tokens.js';
import { productsCommand } from './commands/products.js';
import { auctionsCommand } from './commands/auctions.js';
import { predictionMarketsCommand } from './commands/prediction-markets.js';
import { smartTokensCommand } from './commands/smart-tokens.js';
import { nftsCommand } from './commands/nfts.js';
import { custom2faCommand } from './commands/custom-2fa.js';

// Misc
import { makeCompletionCommand } from './commands/completion.js';
import { maybePrintFirstRunBanner } from './utils/first-run.js';
import { enableSuggestionsTreeWide } from './utils/suggestions.js';

// First-run policies + tab-completion banner. Runs before Commander parses
// so the user sees it ahead of any actual output, even on `bb --help`.
// Best-effort: never blocks, never throws. Suppressed via BB_QUIET=1 or
// once `firstRunAcknowledgedAt` is set in ~/.bitbadges/config.json.
maybePrintFirstRunBanner(process.argv);

const program = new Command();

program
  .name('bitbadges-cli')
  .description('BitBadges CLI — flat verb-first surface for building, inspecting, and shipping token transactions')
  .version('0.1.0');

// ── Policies disclaimer ──────────────────────────────────────────────────────
//
// Every `--help` invocation ends with a link to the published terms /
// privacy / acceptable-use policies. Required for production CLIs that
// emit user-attributable content (feedback submissions, on-chain txs,
// hosted-API calls). Mirrored copy lives at bitbadges-frontend's
// pages/policies.tsx.
// The chaosnet warning mirrors the frontend ChaosnetWarningModal copy
// (bitbadges-frontend public/locales/en/common.json `Chaosnet_Warning_*`).
// The CLI talks to the live network by default and has no acknowledge
// modal, so the warning rides in the always-shown policies footer.
program.addHelpText(
  'after',
  '\nChaosnet warning: BitBadges is running on Chaosnet, a beta testing\n' +
  'period for the protocol. The software is unaudited, transactions use\n' +
  'real tokens (any losses are permanent), and the network may have\n' +
  'downtime or unexpected behavior. Use at your own risk.\n' +
  '\nTerms, privacy, and acceptable-use policies: https://bitbadges.io/policies\n' +
  'By using `bitbadges-cli` you agree to the policies linked above.\n'
);

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
program.option('-q, --quiet', 'Silence stderr commentary (auto-review banners, "Written to" notices, etc). Errors still emit. Equivalent to BB_QUIET=1.');

if (process.argv.includes('--quiet') || process.argv.includes('-q')) {
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
    commands: [buildCommand, checkCommand, explainCommand, simulateCommand, previewCommand, deployCommand, txCommand]
  },
  {
    title: 'Indexer access',
    commands: [createApiCommand(), authCommand]
  },
  {
    title: 'Local state',
    commands: [settingsCommand, burnerCommand, sessionCommand]
  },
  {
    title: 'Discovery',
    commands: [doctorCommand]
  },
  {
    title: 'Dev / agent surface',
    commands: [devCommand]
  },
  {
    title: 'Account & lookup',
    commands: [accountCommand, amountCommand, urlCommand]
  },
  {
    title: 'Swap & DEX',
    commands: [swapCommand, poolsCommand, pairsCommand, balancesCommand, priceCommand, assetsCommand]
  },
  {
    title: 'Standards (end-user actions)',
    commands: [
      payRequestsCommand,
      bountiesCommand,
      subscriptionsCommand,
      intentsCommand,
      creditTokensCommand,
      productsCommand,
      auctionsCommand,
      predictionMarketsCommand,
      smartTokensCommand,
      nftsCommand,
      custom2faCommand,
      dynamicStoresCommand
    ]
  }
];

const completionCommand = makeCompletionCommand(program);
HELP_GROUPS.push({ title: 'Misc', commands: [completionCommand] });

// ── Per-standard `build` alias subcommands ──────────────────────────────────
//
// Each standard parent gains a `build` subcommand that forwards to the
// canonical `bb build <type>`. Restores v1 ergonomics (`bb auctions build
// ...` works the same as `bb build auction ...`) while keeping the
// single source of truth for build logic. Standards without a 1:1 build
// counterpart (nfts, dynamic-stores) are skipped.
import { makeBuildAlias } from './utils/build-alias.js';
const STANDARD_BUILD_ALIASES: Record<string, string> = {
  auctions: 'auction',
  bounties: 'bounty',
  'credit-tokens': 'credit-token',
  intents: 'intent',
  'pay-requests': 'payment-request',
  'prediction-markets': 'prediction-market',
  products: 'product-catalog',
  'smart-tokens': 'smart-token',
  subscriptions: 'subscription'
};
const standardsByName = new Map<string, Command>();
for (const group of HELP_GROUPS) {
  for (const cmd of group.commands) standardsByName.set(cmd.name(), cmd);
}
for (const [standardName, buildSubtype] of Object.entries(STANDARD_BUILD_ALIASES)) {
  const parent = standardsByName.get(standardName);
  if (!parent) continue;
  parent.addCommand(makeBuildAlias(buildSubtype, buildCommand));
}

// ── Register every command at the top level ─────────────────────────────────

for (const group of HELP_GROUPS) {
  for (const cmd of group.commands) {
    program.addCommand(cmd);
  }
}

// ── v2 deprecated aliases — old top-level forms → new `account` home ────────
//
// Each old top-level verb (`portfolio`, `address`, `lookup`, `alias`,
// `gen-list-id`) still works for one release. Hidden from grouped help
// to keep `bb --help` clean; reachable when users / scripts type the
// v1 form. Banner emits via `emitDeprecation` from utils/deprecation.ts.
//
// Forwarding rules:
//   - `bb portfolio <sub> [args]`        → `bb account <sub> [args]`
//   - `bb address <sub> [args]`          → `bb account <sub> [args]`
//                                           (address.convert / address.validate
//                                            live as flat `account convert /
//                                            account validate` subcommands)
//   - `bb lookup [symbol]`               → `bb account lookup [symbol]`
//   - `bb alias <sub> [args]`            → `bb account alias <sub> [args]`
//   - `bb gen-list-id <addrs...>`        → `bb account gen-list-id <addrs...>`

const portfolioAlias = makeDeprecatedAlias({
  oldName: 'portfolio',
  newPath: 'bb account',
  description: 'Deprecated — use `bb account` instead.',
  forward: (args) => ['account', ...args],
  target: program,
});
const addressAlias = makeDeprecatedAlias({
  oldName: 'address',
  newPath: 'bb account',
  description: 'Deprecated — `convert` / `validate` are now `bb account convert` / `bb account validate`.',
  forward: (args) => ['account', ...args],
  target: program,
});
const lookupAlias = makeDeprecatedAlias({
  oldName: 'lookup',
  newPath: 'bb account lookup',
  description: 'Deprecated — use `bb account lookup` instead.',
  forward: (args) => ['account', 'lookup', ...args],
  target: program,
});
const aliasAlias = makeDeprecatedAlias({
  oldName: 'alias',
  newPath: 'bb account alias',
  description: 'Deprecated — use `bb account alias` instead.',
  forward: (args) => ['account', 'alias', ...args],
  target: program,
});
const genListIdAlias = makeDeprecatedAlias({
  oldName: 'gen-list-id',
  newPath: 'bb account gen-list-id',
  description: 'Deprecated — use `bb account gen-list-id` instead.',
  forward: (args) => ['account', 'gen-list-id', ...args],
  target: program,
});

program.addCommand(portfolioAlias);
program.addCommand(addressAlias);
program.addCommand(lookupAlias);
program.addCommand(aliasAlias);
program.addCommand(genListIdAlias);

// Signing commands absorbed into `deploy` flags. The standalone commands
// still work for one release — they emit the deprecation banner from
// inside their action handlers (see sign-with-browser.ts / gen-tx-payload.ts),
// so we just register them at top level without putting them in the
// grouped help.
program.addCommand(signWithBrowserCommand);
program.addCommand(genTxPayloadCommand);

// Dev/agent surface aliases. Old top-level forms (`tools`, `tool`,
// `resources`, `docs`, `skills`, `gen-pub-key`) all lived at the root
// of the v1 CLI. v2 nests them under `bb dev`. Each old form stays
// reachable for one release; banner emits via `makeDeprecatedAlias`.
const toolsAlias = makeDeprecatedAlias({
  oldName: 'tools',
  newPath: 'bb dev tools list',
  description: 'Deprecated — use `bb dev tools list` instead.',
  forward: (args) => ['dev', 'tools', 'list', ...args],
  target: program,
});
const toolAlias = makeDeprecatedAlias({
  oldName: 'tool',
  newPath: 'bb dev tools call',
  description: 'Deprecated — use `bb dev tools call <name>` instead.',
  forward: (args) => ['dev', 'tools', 'call', ...args],
  target: program,
});
const resourcesAlias = makeDeprecatedAlias({
  oldName: 'resources',
  newPath: 'bb dev resources',
  description: 'Deprecated — use `bb dev resources` instead.',
  forward: (args) => ['dev', 'resources', ...args],
  target: program,
});
const docsAlias = makeDeprecatedAlias({
  oldName: 'docs',
  newPath: 'bb dev docs',
  description: 'Deprecated — use `bb dev docs` instead.',
  forward: (args) => ['dev', 'docs', ...args],
  target: program,
});
const skillsAlias = makeDeprecatedAlias({
  oldName: 'skills',
  newPath: 'bb dev skills',
  description: 'Deprecated — use `bb dev skills` instead.',
  forward: (args) => ['dev', 'skills', ...args],
  target: program,
});
const genPubKeyAlias = makeDeprecatedAlias({
  oldName: 'gen-pub-key',
  newPath: 'bb dev gen-pub-key',
  description: 'Deprecated — use `bb dev gen-pub-key` instead.',
  forward: (args) => ['dev', 'gen-pub-key', ...args],
  target: program,
});

program.addCommand(toolsAlias);
program.addCommand(toolAlias);
program.addCommand(resourcesAlias);
program.addCommand(docsAlias);
program.addCommand(skillsAlias);
program.addCommand(genPubKeyAlias);

// `config` → `settings` rename. Frees `bb config` for the chain binary
// (client.toml management) once the flat namespace ships chain-side.
// Old `bb config ...` form works for one release with the banner.
const configAlias = makeDeprecatedAlias({
  oldName: 'config',
  newPath: 'bb settings',
  description: 'Deprecated — use `bb settings` instead.',
  forward: (args) => ['settings', ...args],
  target: program,
});
program.addCommand(configAlias);

// ── `cli` umbrella — back-compat alias for the v1 `bb cli <cmd>` shape ──────
//
// Pre-v2 the chain-binary forwarder routed every Node CLI invocation as
// `bb cli <subcmd> [args...]`. v2 flattens to `bb <subcmd>`. To avoid
// breaking existing scripts / docs / muscle memory, this `cli` parent
// catches the v1 form, prints a one-line deprecation banner, then
// re-dispatches the remaining argv through the root program.
//
// Reached when:
//   1. The user invokes `bitbadges-cli cli <subcmd>` directly (rare today,
//      but the chain wrapper will start passing `cli` through in a
//      companion bitbadgeschain PR).
//   2. Anyone has scripted against the v1 layout and explicitly types
//      `bitbadges-cli cli build vault`.
//
// Banner is suppressed when `BB_QUIET=1`. The actual dispatch uses
// `parseAsync(..., { from: 'user' })` so positional args + flags reach
// the target command exactly as written.

const cliAliasCommand = new Command('cli')
  .description('Deprecated alias: every command is now top-level. `bb cli <cmd>` → `bb <cmd>`.')
  .helpOption(false)
  .allowUnknownOption()
  .allowExcessArguments()
  .argument('[args...]', 'Forwarded to the corresponding top-level command')
  .action(async (args: string[]) => {
    if (!args || args.length === 0) {
      // `bb cli` with no subcommand: show root --help and emit the banner.
      emitDeprecation('bb cli', 'bb <cmd>');
      program.outputHelp();
      return;
    }
    emitDeprecation(`bb cli ${args[0]}`, `bb ${args[0]}`);
    await program.parseAsync(args, { from: 'user' });
  });
program.addCommand(cliAliasCommand);

// ── "Did you mean?" for typos ───────────────────────────────────────────────
//
// Levenshtein suggestions on unknown subcommands AND unknown flags. Toggle
// has to be applied to every Command in the tree (Commander does not
// inherit it), so we run after all top-level + alias registration.
enableSuggestionsTreeWide(program);

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
    if (desc) sections.push('', wrapText(desc, HELP_WIDTH, ''));

    const optList = helper.visibleOptions(cmd);
    if (optList.length > 0) {
      sections.push('', 'Options:');
      for (const opt of optList) {
        sections.push(renderRow(helper.optionTerm(opt), helper.optionDescription(opt), 2));
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
        sections.push(renderRow(helper.subcommandTerm(c), helper.subcommandDescription(c), 4, TERM_COL - 2));
      }
    }

    return sections.join('\n') + '\n';
  }
});

function defaultFormatHelp(cmd: Command, helper: any): string {
  // Minimal flat formatter for non-root commands. Uses the shared
  // renderRow/wrapText helpers so column alignment + description reflow
  // stay consistent with GroupedHelp.
  const sections: string[] = [];
  sections.push(`Usage: ${helper.commandUsage(cmd)}`);
  const desc = helper.commandDescription(cmd);
  if (desc) sections.push('', wrapText(desc, HELP_WIDTH, ''));

  const argList = helper.visibleArguments(cmd);
  if (argList.length > 0) {
    sections.push('', 'Arguments:');
    for (const arg of argList) {
      sections.push(renderRow(helper.argumentTerm(arg), helper.argumentDescription(arg), 2));
    }
  }

  // Split options into Required (`.requiredOption(...)`, Commander sets
  // `mandatory = true`) and Options (everything else). Help-bearing flags
  // like `-h, --help` stay in Options.
  const optList = helper.visibleOptions(cmd);
  const requiredOpts = optList.filter((o: any) => o.mandatory);
  const optionalOpts = optList.filter((o: any) => !o.mandatory);

  if (requiredOpts.length > 0) {
    sections.push('', 'Required:');
    for (const opt of requiredOpts) {
      sections.push(renderRow(helper.optionTerm(opt), helper.optionDescription(opt), 2));
    }
  }
  if (optionalOpts.length > 0) {
    sections.push('', 'Options:');
    for (const opt of optionalOpts) {
      sections.push(renderRow(helper.optionTerm(opt), helper.optionDescription(opt), 2));
    }
  }

  const subList = helper.visibleCommands(cmd);
  if (subList.length > 0) {
    sections.push('', 'Commands:');
    for (const sub of subList) {
      sections.push(renderRow(helper.subcommandTerm(sub), helper.subcommandDescription(sub), 2));
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
  // Pretty-print only for interactive readers (humans on a TTY). Pipes,
  // spawnSync collectors, agentic shells get the compact form so the
  // output fits in standard maxBuffer (~1MB). Pretty-printed tree is
  // ~1.4MB, compact is ~500KB.
  const pretty = !!process.stdout.isTTY;
  const json = JSON.stringify(tree, null, pretty ? 2 : 0) + '\n';
  // Async write + 'drain' wait pattern. process.stdout.write returns
  // false once the OS pipe buffer (~64KB on Linux) fills; the 'drain'
  // event fires when the reader (e.g. spawnSync's pipe collector)
  // catches up. We can't simply fs.writeSync — it throws EAGAIN on
  // non-blocking pipes, and Atomics.wait retry doesn't yield enough
  // for the parent to drain under a tight test timeout.
  //
  // The rest of this module (Commander wiring, program.parse()) runs
  // synchronously after this IIFE returns control. `program.parse()`
  // with `--help-json` as the only arg is a no-op (Commander recognises
  // the option but has no default handler), so falling through is
  // benign. The IIFE's `process.exit(0)` fires once the JSON has been
  // fully flushed and ends the process for real.
  (async () => {
    if (!process.stdout.write(json)) {
      await new Promise<void>((resolve) => process.stdout.once('drain', () => resolve()));
    }
    process.exit(0);
  })().catch((err) => {
    process.stderr.write(`Error emitting --help-json: ${(err as Error)?.message ?? err}\n`);
    process.exit(1);
  });
}

// ── Top-level error handler ─────────────────────────────────────────────────
//
// Commander itself prints a friendly "error: required option ..." line and
// exits non-zero on flag-shape errors, but anything thrown from inside an
// .action() handler (e.g. SDK validation errors from `bb build *`) hits
// Node's default uncaughtException printer, which dumps a 5-line stack
// trace. That noise drowns out the actual error message and is useless for
// agents reading stderr. Install handlers that print a single clean
// "Error: <message>" line and exit 1. Stacks are still available via
// `BB_DEBUG=1` for humans debugging the CLI itself.
function reportFatal(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${msg}\n`);
  if (process.env.BB_DEBUG === '1' && err instanceof Error && err.stack) {
    process.stderr.write(err.stack + '\n');
  }
  process.exit(1);
}
process.on('uncaughtException', reportFatal);
process.on('unhandledRejection', reportFatal);

// When invoked with no args, show the full grouped --help by default.
// Commander's stock behavior prints a minimal "Usage:" stanza and exits —
// agents and humans both reach for the long form (commands + groups).
// Detect "no positional args + no help-json + no quiet-only" and route
// through `outputHelp()` which uses our custom grouped formatter.
const onlyGlobalFlags = process.argv.slice(2).every((a) => a === '--quiet' || a === '-q');
if (process.argv.length <= 2 || onlyGlobalFlags) {
  program.outputHelp();
  process.exit(0);
}

// --help-json has its own emit path (above). Skip Commander's parse so
// it doesn't fall back to printing help text alongside the JSON.
if (!process.argv.includes('--help-json')) {
  program.parse();
}
