import { Command } from 'commander';
import { readJsonInput, output, getApiUrl } from '../utils/io.js';

export const sdkCommand = new Command('sdk').description('SDK analysis and utility commands');

// ── sdk review <file> ──────────────────────────────────────────────────────────

sdkCommand
  .command('review <file>')
  .description('Review a transaction or collection JSON for issues')
  .option('--human', 'Output human-readable text instead of JSON')
  .option('--testnet', 'Use testnet API URL')
  .option('--local', 'Use local API URL (http://localhost:3001)')
  .action(async (file: string, opts: { human?: boolean; testnet?: boolean; local?: boolean }) => {
    const data = readJsonInput(file);
    const isTransaction = !!data.messages || !!data.msgs;

    if (isTransaction) {
      // Try enriched simulate via indexer first
      const apiKey = process.env.BITBADGES_API_KEY;
      const apiUrl = getApiUrl(opts);

      if (apiKey) {
        try {
          const axios = (await import('axios')).default;
          const response = await axios.post(`${apiUrl}/api/v0/simulate`, data, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
          });
          output(response.data, opts);
          return;
        } catch {
          // Fall through to local analysis
        }
      }

      // Local fallback
      const { validateTransaction } = await import('../../core/validate.js');
      const { auditCollection } = await import('../../core/audit.js');
      const { verifyStandardsCompliance } = await import('../../core/verify-standards.js');

      const validation = validateTransaction(data);
      const standards = verifyStandardsCompliance(data);

      // Try to extract collection from the first message for audit
      const msg = data.messages?.[0] || data.msgs?.[0];
      const value = msg?.value || msg;
      let audit = null;
      if (value) {
        try {
          audit = auditCollection({ collection: value });
        } catch {
          // Collection audit not applicable for this message type
        }
      }

      output({ validation, standards, audit }, opts);
    } else {
      // Collection review
      const { auditCollection } = await import('../../core/audit.js');
      const { verifyStandardsCompliance } = await import('../../core/verify-standards.js');

      const audit = auditCollection({ collection: data });
      let standards = null;
      try {
        standards = verifyStandardsCompliance(data);
      } catch {
        // Standards check may not apply to raw collections
      }

      output({ audit, standards }, opts);
    }
  });

// ── sdk interpret-tx <file> ────────────────────────────────────────────────────

sdkCommand
  .command('interpret-tx <file>')
  .description('Interpret a transaction JSON and print a human-readable summary')
  .action(async (file: string) => {
    const data = readJsonInput(file);
    const { interpretTransaction } = await import('../../core/interpret-transaction.js');
    const result = interpretTransaction(data);
    console.log(result);
  });

// ── sdk interpret-collection <file> ────────────────────────────────────────────

sdkCommand
  .command('interpret-collection <file>')
  .description('Interpret a collection JSON and print a human-readable summary')
  .action(async (file: string) => {
    const data = readJsonInput(file);
    const { interpretCollection } = await import('../../core/interpret.js');
    const result = interpretCollection(data);
    console.log(result);
  });

// ── sdk address ────────────────────────────────────────────────────────────────

const addressCmd = sdkCommand.command('address').description('Address conversion and validation utilities');

addressCmd
  .command('convert <address>')
  .description('Convert an address between bb1 and 0x formats')
  .requiredOption('--to <format>', 'Target format: bb1 or 0x')
  .action(async (address: string, opts: { to: string }) => {
    const { convertToBitBadgesAddress, convertToEthAddress } = await import('../../address-converter/converter.js');

    if (opts.to === 'bb1') {
      console.log(convertToBitBadgesAddress(address));
    } else if (opts.to === '0x') {
      console.log(convertToEthAddress(address));
    } else {
      console.error(`Unknown format: ${opts.to}. Use bb1 or 0x.`);
      process.exit(1);
    }
  });

addressCmd
  .command('validate <address>')
  .description('Validate an address and detect its chain')
  .action(async (address: string) => {
    const { isAddressValid, getChainForAddress } = await import('../../address-converter/converter.js');

    const valid = isAddressValid(address);
    const chain = getChainForAddress(address);

    const chainLabel = chain === 'Cosmos' ? 'BitBadges' : chain === 'ETH' ? 'Ethereum' : 'Unknown';

    console.log(JSON.stringify({ valid, chain: chainLabel, address }, null, 2));
  });

// ── sdk alias ──────────────────────────────────────────────────────────────────

const aliasCmd = sdkCommand.command('alias').description('Generate alias addresses for denoms and collections');

aliasCmd
  .command('for-denom <denom>')
  .description('Generate alias address for a denom (IBC or native)')
  .action(async (denom: string) => {
    const { generateAliasAddressForIBCBackedDenom, generateAliasAddressForDenom } = await import('../../core/aliases.js');

    if (denom.startsWith('ibc/')) {
      console.log(generateAliasAddressForIBCBackedDenom(denom));
    } else {
      console.log(generateAliasAddressForDenom(denom));
    }
  });

aliasCmd
  .command('for-collection <collectionId>')
  .description('Generate alias address for a collection mint escrow')
  .action(async (collectionId: string) => {
    const { getAliasDerivationKeysForCollection, generateAlias } = await import('../../core/aliases.js');

    const derivationKeys = getAliasDerivationKeysForCollection(collectionId);
    const address = generateAlias('badges', derivationKeys);
    console.log(address);
  });

// ── sdk gen-list-id <addresses...> ─────────────────────────────────────────────

sdkCommand
  .command('gen-list-id <addresses...>')
  .description('Generate a reserved address list ID from a set of addresses')
  .option('--blacklist', 'Treat as blacklist (default is whitelist)')
  .action(async (addresses: string[], opts: { blacklist?: boolean }) => {
    const { generateReservedListId } = await import('../../core/addressLists.js');

    const whitelist = !opts.blacklist;
    const listId = generateReservedListId({
      listId: '',
      addresses,
      whitelist,
      uri: '',
      customData: ''
    });
    console.log(listId);
  });

// ── sdk skills ─────────────────────────────────────────────────────────────────

const KNOWN_SKILLS = [
  'smart-token',
  'minting',
  'liquidity-pools',
  'fungible-token',
  'nft-collection',
  'subscription',
  'immutability',
  'custom-2fa',
  'address-list',
  'bb-402',
  'burnable',
  'multi-sig-voting',
  'payment-protocol',
  'tradable',
  'credit-token',
  'auto-mint',
  'quest',
  'prediction-market',
  'bounty'
];

const skillsCmd = sdkCommand.command('skills').description('Fetch MCP builder skill instructions');

skillsCmd
  .command('list')
  .description('List all available skill IDs')
  .action(() => {
    for (const id of KNOWN_SKILLS) {
      console.log(id);
    }
  });

skillsCmd
  .command('get <skillId>')
  .description('Fetch skill instructions by ID (from docs site)')
  .option('--url <url>', 'Override base URL for skill docs')
  .action(async (skillId: string, opts: { url?: string }) => {
    const baseUrl = opts.url || 'https://docs.bitbadges.io/token-standard/skills';
    const url = `${baseUrl}/${skillId}`;

    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(url, { responseType: 'text' });
      console.log(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.error(`Skill "${skillId}" not found. Available skills:`);
        for (const id of KNOWN_SKILLS) {
          console.error(`  ${id}`);
        }
      } else {
        console.error(`Failed to fetch skill "${skillId}" from ${url}: ${err.message}`);
      }
      process.exit(1);
    }
  });

// ── sdk docs ───────────────────────────────────────────────────────────────────

sdkCommand
  .command('docs')
  .description('Fetch BitBadges documentation for LLMs')
  .option('--url <url>', 'Override the documentation URL')
  .action(async (opts: { url?: string }) => {
    const url = opts.url || 'https://docs.bitbadges.io/for-llms.txt';

    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(url, { responseType: 'text' });
      console.log(response.data);
    } catch (err: any) {
      console.error(`Failed to fetch docs from ${url}: ${err.message}`);
      process.exit(1);
    }
  });
