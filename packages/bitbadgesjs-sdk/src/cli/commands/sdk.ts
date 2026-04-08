import { Command } from 'commander';
import { readJsonInput, output, getApiUrl } from '../utils/io.js';
import { loadConfig, getConfigPath } from '../utils/config.js';
import { resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';

export const sdkCommand = new Command('sdk').description('SDK analysis and utility commands');

// ── sdk review <input> ─────────────────────────────────────────────────────────

sdkCommand
  .command('review <input>')
  .description('Review a transaction or collection JSON for issues. Input: JSON file, inline JSON, collection ID, or - for stdin')
  .option('--human', 'Output human-readable text instead of JSON')
  .option('--testnet', 'Use testnet API URL')
  .option('--local', 'Use local API URL (http://localhost:3001)')
  .option('--url <url>', 'Custom API base URL')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (input: string, opts: { human?: boolean; testnet?: boolean; local?: boolean; url?: string; outputFile?: string }) => {
    let data;
    if (/^\d+$/.test(input)) {
      // Numeric ID — fetch collection from API
      const baseUrl = getApiUrl(opts);
      const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
        headers: { 'x-api-key': process.env.BITBADGES_API_KEY || '' }
      });
      if (!response.ok) throw new Error(`Failed to fetch collection ${input}: HTTP ${response.status}`);
      data = await response.json();
    } else {
      data = readJsonInput(input);
    }
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

// ── sdk interpret-tx <input> ───────────────────────────────────────────────────

sdkCommand
  .command('interpret-tx <input>')
  .description('Interpret a transaction JSON and print a human-readable summary. Input: JSON file, inline JSON, or - for stdin')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (input: string, opts: { outputFile?: string }) => {
    const data = readJsonInput(input);
    const { interpretTransaction } = await import('../../core/interpret-transaction.js');
    const result = interpretTransaction(data);
    if (opts.outputFile) {
      const fs = await import('fs');
      fs.writeFileSync(opts.outputFile, result + '\n', 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
    } else {
      console.log(result);
    }
  });

// ── sdk interpret-collection <input> ───────────────────────────────────────────

sdkCommand
  .command('interpret-collection <input>')
  .description('Interpret a collection JSON and print a human-readable summary. Input: JSON file, inline JSON, collection ID, or - for stdin')
  .option('--testnet', 'Use testnet API URL')
  .option('--local', 'Use local API URL (http://localhost:3001)')
  .option('--url <url>', 'Custom API base URL')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (input: string, opts: { testnet?: boolean; local?: boolean; url?: string; outputFile?: string }) => {
    let data;
    if (/^\d+$/.test(input)) {
      // Numeric ID — fetch collection from API
      const baseUrl = getApiUrl(opts);
      const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
        headers: { 'x-api-key': process.env.BITBADGES_API_KEY || '' }
      });
      if (!response.ok) throw new Error(`Failed to fetch collection ${input}: HTTP ${response.status}`);
      data = await response.json();
    } else {
      data = readJsonInput(input);
    }
    const { interpretCollection } = await import('../../core/interpret.js');
    const result = interpretCollection(data);
    if (opts.outputFile) {
      const fs = await import('fs');
      fs.writeFileSync(opts.outputFile, result + '\n', 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
    } else {
      console.log(result);
    }
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

// ── sdk lookup-token ──────────────────────────────────────────────────────────

const TOKEN_REGISTRY: Record<string, { symbol: string; ibcDenom: string; decimals: number }> = {
  BADGE: { symbol: 'BADGE', ibcDenom: 'ubadge', decimals: 9 },
  CHAOS: { symbol: 'CHAOS', ibcDenom: 'badges:49:chaosnet', decimals: 9 },
  USDC: { symbol: 'USDC', ibcDenom: 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349', decimals: 6 },
  ATOM: { symbol: 'ATOM', ibcDenom: 'ibc/A4DB47A9D3CF9A068D454513891B526702455D3EF08FB9EB558C561F9DC2B701', decimals: 6 },
  OSMO: { symbol: 'OSMO', ibcDenom: 'ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518', decimals: 6 }
};

sdkCommand
  .command('lookup-token <symbol>')
  .description('Look up token info by symbol — returns IBC denom, decimals, and backing address')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (symbol: string, opts: { outputFile?: string }) => {
    const entry = TOKEN_REGISTRY[symbol.toUpperCase()];
    if (!entry) {
      console.error(`Unknown token "${symbol}". Known tokens: ${Object.keys(TOKEN_REGISTRY).join(', ')}`);
      process.exit(1);
    }

    let backingAddress = '';
    if (entry.ibcDenom.startsWith('ibc/')) {
      const { generateAliasAddressForIBCBackedDenom } = await import('../../core/aliases.js');
      backingAddress = generateAliasAddressForIBCBackedDenom(entry.ibcDenom);
    }

    const result = JSON.stringify({
      symbol: entry.symbol,
      ibcDenom: entry.ibcDenom,
      decimals: entry.decimals,
      ...(backingAddress ? { backingAddress } : {})
    }, null, 2);

    if (opts.outputFile) {
      const fs = await import('fs');
      fs.writeFileSync(opts.outputFile, result + '\n', 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
    } else {
      console.log(result);
    }
  });

// ── sdk alias ──────────────────────────────────────────────────────────────────

const aliasCmd = sdkCommand.command('alias').description('Generate protocol-derived alias addresses');

aliasCmd
  .command('for-ibc-backing <ibcDenom>')
  .description('Generate backing address for an IBC-backed smart token (uses BackedPathGenerationPrefix)')
  .action(async (ibcDenom: string) => {
    const { generateAliasAddressForIBCBackedDenom } = await import('../../core/aliases.js');
    console.log(generateAliasAddressForIBCBackedDenom(ibcDenom));
  });

aliasCmd
  .command('for-wrapper <denom>')
  .description('Generate wrapper path address for a cosmos coin wrapper (uses DenomGenerationPrefix)')
  .action(async (denom: string) => {
    const { generateAliasAddressForDenom } = await import('../../core/aliases.js');
    console.log(generateAliasAddressForDenom(denom));
  });

aliasCmd
  .command('for-mint-escrow <collectionId>')
  .description('Generate mint escrow address for a collection (where to send quest reward funds, etc.)')
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

sdkCommand
  .command('skills [skillId]')
  .description('List available skills or fetch a specific skill by ID')
  .option('--url <url>', 'Override base URL for skill docs')
  .addHelpText('after', `\nAvailable skill IDs:\n${KNOWN_SKILLS.map((s) => `  ${s}`).join('\n')}`)
  .action(async (skillId: string | undefined, opts: { url?: string }) => {
    if (!skillId) {
      // List all skills
      for (const id of KNOWN_SKILLS) {
        console.log(id);
      }
      return;
    }

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
    const url = opts.url || 'https://raw.githubusercontent.com/BitBadges/bitbadges-docs/master/for-llms.txt';

    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(url, { responseType: 'text' });
      console.log(response.data);
    } catch (err: any) {
      console.error(`Failed to fetch docs from ${url}: ${err.message}`);
      process.exit(1);
    }
  });

// ── sdk status ────────────────────────────────────────────────────────────────

sdkCommand
  .command('status')
  .description('Show CLI status: API key, network, base URL, config path, and API health')
  .option('--testnet', 'Use testnet API URL')
  .option('--local', 'Use local API URL')
  .action(async (opts: { testnet?: boolean; local?: boolean }) => {
    const config = loadConfig();
    const configPath = getConfigPath();

    // API key status
    let apiKeyStatus = '(not set)';
    try {
      const key = resolveApiKey();
      apiKeyStatus = key.length <= 8 ? '****' : key.slice(0, 4) + '****' + key.slice(-4);
    } catch {
      // No key configured
    }

    // Network / base URL
    const baseUrl = resolveBaseUrl({
      testnet: opts.testnet,
      local: opts.local,
    });

    const network = opts.testnet
      ? 'testnet'
      : opts.local
        ? 'local'
        : config.network || 'mainnet';

    console.log('BitBadges CLI Status');
    console.log('====================');
    console.log(`  API Key:      ${apiKeyStatus}`);
    console.log(`  Network:      ${network}`);
    console.log(`  Base URL:     ${baseUrl}`);
    console.log(`  Config file:  ${configPath}`);
    console.log(`  Node.js:      ${process.version}`);

    // Try to get SDK version from package.json
    try {
      const fs = await import('fs');
      const path = await import('path');
      // Walk up from this file to find package.json
      let dir = __dirname;
      let sdkVersion = 'unknown';
      for (let i = 0; i < 6; i++) {
        const candidate = path.join(dir, 'package.json');
        if (fs.existsSync(candidate)) {
          const pkg = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
          if (pkg.name && pkg.version) {
            sdkVersion = pkg.version;
            break;
          }
        }
        dir = path.dirname(dir);
      }
      console.log(`  SDK version:  ${sdkVersion}`);
    } catch {
      console.log(`  SDK version:  unknown`);
    }

    // Health check
    console.log('');
    process.stdout.write('  API health:   ');
    try {
      const response = await fetch(`${baseUrl}/status`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        console.log('reachable');
      } else {
        console.log(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      console.log(`unreachable (${err.message})`);
    }
  });
