import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Command } from 'commander';
import { z } from 'zod';
import { payRequestsCommand } from '../../cli/commands/pay-requests.js';
import { subscriptionsCommand } from '../../cli/commands/subscriptions.js';
import { standardsCommand } from '../../cli/commands/standards.js';
import { smartTokensCommand } from '../../cli/commands/smart-tokens.js';
import { spendableCreditsCommand } from '../../cli/commands/spendable-credits.js';
import { creditTokensCommand } from '../../cli/commands/credit-tokens.js';
import { productsCommand } from '../../cli/commands/products.js';
import { auctionsCommand } from '../../cli/commands/auctions.js';
import { crowdfundsCommand } from '../../cli/commands/crowdfunds.js';
import { bountiesCommand } from '../../cli/commands/bounties.js';
import { predictionMarketsCommand } from '../../cli/commands/prediction-markets.js';

const surfaces: [Command, string[]][] = [
  [payRequestsCommand, ['list', 'show', 'status', 'pay', 'deny']],
  [subscriptionsCommand, ['list', 'status', 'claim', 'enable-renewal', 'cancel', 'subscribe', 'charge-due']],
  [standardsCommand, ['inspect']],
  [smartTokensCommand, ['list', 'show', 'status', 'deposit', 'withdraw']],
  [spendableCreditsCommand, ['show', 'quote', 'purchase', 'consume']],
  [creditTokensCommand, ['list', 'show', 'quote', 'purchase']],
  [productsCommand, ['list', 'show', 'purchase']],
  [auctionsCommand, ['list', 'show', 'status', 'place-bid', 'cancel-bid', 'accept-bid']],
  [crowdfundsCommand, ['list', 'show', 'status', 'contribute', 'withdraw', 'refund']],
  [bountiesCommand, ['list', 'show', 'status', 'accept', 'deny', 'claim-refund']],
  [
    predictionMarketsCommand,
    ['list', 'show', 'status', 'quote', 'buy-yes', 'buy-no', 'sell-yes', 'sell-no', 'cancel', 'deposit', 'redeem', 'resolve']
  ]
];
const allowedOptions = new Set([
  '--request-id',
  '--family',
  '--creator',
  '--tier',
  '--tip',
  '--approval-id',
  '--obligation',
  '--units',
  '--address',
  '--mine',
  '--open',
  '--amount',
  '--denom',
  '--base-units',
  '--bidder',
  '--token-id',
  '--api-credits',
  '--dry-run',
  '--token-amount',
  '--payment-amount',
  '--side',
  '--state',
  '--pair-amount',
  '--yes-amount',
  '--no-amount',
  '--yes-balance',
  '--no-balance',
  '--outcome',
  '--mainnet',
  '--testnet',
  '--local',
  '--limit',
  '--bookmark'
]);
const camelCase = (name: string) => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
type Execute = (argv: string[]) => Promise<any>;
const executeFile = promisify(execFile);

export async function executeInstalledCli(argv: string[]) {
  let stdout: string;
  let failedProcess = false;
  try {
    ({ stdout } = await executeFile(process.env.BITBADGES_CLI_PATH || 'bitbadges-cli', argv, {
      encoding: 'utf8',
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, BB_QUIET: '1' }
    }));
  } catch (error) {
    failedProcess = true;
    const failed = error as { stdout?: string; code?: string };
    if (!failed.stdout)
      throw new Error(
        `CLI action unavailable or rejected. Ensure bitbadges-cli is installed and run bb ${argv.slice(0, 2).join(' ')} --help for input requirements.`
      );
    stdout = failed.stdout;
  }
  let result: any;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error('CLI returned an invalid JSON envelope. Use the CLI from the same SDK installation.');
  }
  if (!result || typeof result.ok !== 'boolean') throw new Error('CLI returned an unsupported result envelope.');
  if (failedProcess && result.ok) throw new Error('CLI process failed before completing the action. Inspect state before continuing.');
  return result;
}

export function createStandardActionTools(execute: Execute, expectedCatalogHash: () => string) {
  const entries: Record<
    string,
    {
      tool: {
        name: string;
        description: string;
        inputSchema: { type: 'object'; additionalProperties: false; properties: Record<string, unknown>; required: string[] };
      };
      run: (input: unknown) => Promise<any>;
    }
  > = {};
  for (const [parent, actions] of surfaces) {
    for (const action of actions) {
      const command = parent.commands.find((candidate) => candidate.name() === action);
      if (!command) throw new Error(`Missing standard CLI action: ${parent.name()} ${action}`);
      const properties: Record<string, unknown> = {};
      const validators: Record<string, z.ZodTypeAny> = {};
      const required: string[] = [];
      const options = command.options.filter((option) => allowedOptions.has(option.long || ''));
      for (const option of command.options) {
        if (option.mandatory && !options.includes(option))
          throw new Error(`Unmapped mandatory standard option: ${parent.name()} ${action} ${option.long}`);
      }
      for (const argument of command.registeredArguments) {
        if (argument.variadic) throw new Error('Variadic standard arguments require an explicit adapter.');
        const key = camelCase(argument.name());
        properties[key] = { type: 'string', minLength: 1, description: argument.description };
        validators[key] = argument.required ? z.string().min(1) : z.string().min(1).optional();
        if (argument.required) required.push(key);
      }
      for (const option of options) {
        const key = option.attributeName();
        if (validators[key]) throw new Error(`Conflicting standard input: ${key}`);
        const boolean = !option.required && !option.optional;
        properties[key] = {
          type: boolean ? 'boolean' : 'string',
          description: option.description,
          ...(option.argChoices ? { enum: option.argChoices } : {})
        };
        const validator = boolean ? z.boolean() : option.argChoices ? z.enum(option.argChoices as [string, ...string[]]) : z.string().min(1);
        validators[key] = option.mandatory ? validator : validator.optional();
        if (option.mandatory) required.push(key);
      }
      const schema = z
        .object(validators)
        .strict()
        .refine((value) => ['mainnet', 'testnet', 'local'].filter((key) => value[key] === true).length <= 1, 'Select only one network.');
      const name = `standard_${parent.name()}_${action}`.replace(/-/g, '_');
      entries[name] = {
        tool: {
          name,
          description: `Run bb ${parent.name()} ${action} using the matching installed CLI. Returns read-only state or an unsigned transaction proposal. Never signs or broadcasts. Business rules and units match CLI help; string amount inputs retain exact decimal text. Requires configured API access for remote reads. CLI signing, credential, endpoint, and file options are not exposed.`,
          inputSchema: { type: 'object', additionalProperties: false, properties, required }
        },
        run: async (input) => {
          const args = schema.parse(input);
          const argv = [parent.name(), action];
          for (const option of options) {
            const value = args[option.attributeName()];
            if (value === undefined || value === false) continue;
            argv.push(value === true ? option.long! : `${option.long}=${value}`);
          }
          argv.push('--');
          for (const argument of command.registeredArguments) {
            const value = args[camelCase(argument.name())];
            if (value !== undefined) argv.push(String(value));
          }
          const catalog = await execute(['dev', 'capabilities']);
          if (!catalog?.ok || catalog.data?.catalogHash !== expectedCatalogHash())
            throw new Error('CLI catalog differs from MCP. Use binaries from the same SDK installation.');
          return execute(argv);
        }
      };
    }
  }
  return entries;
}
