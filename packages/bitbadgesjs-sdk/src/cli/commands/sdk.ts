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

sdkCommand
  .command('lookup-token [symbol]')
  .description('Look up token info by symbol — returns IBC denom, decimals, backing address, and supported networks. Omit symbol to list all tokens.')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (symbol: string | undefined, opts: { outputFile?: string }) => {
    const { MAINNET_COINS_REGISTRY, TESTNET_COINS_REGISTRY } = await import('../../common/constants.js');

    // Build combined registry with network info
    const allSymbols = new Map<string, { symbol: string; ibcDenom: string; decimals: number; networks: string[] }>();

    for (const [denom, coin] of Object.entries(MAINNET_COINS_REGISTRY)) {
      const key = coin.symbol.toUpperCase();
      const existing = allSymbols.get(key);
      if (existing) {
        if (!existing.networks.includes('mainnet')) existing.networks.push('mainnet');
      } else {
        allSymbols.set(key, { symbol: coin.symbol, ibcDenom: denom, decimals: Number(coin.decimals), networks: ['mainnet'] });
      }
    }

    for (const [denom, coin] of Object.entries(TESTNET_COINS_REGISTRY)) {
      const key = coin.symbol.toUpperCase();
      const existing = allSymbols.get(key);
      if (existing) {
        if (!existing.networks.includes('testnet')) existing.networks.push('testnet');
      } else {
        allSymbols.set(key, { symbol: coin.symbol, ibcDenom: denom, decimals: Number(coin.decimals), networks: ['testnet'] });
      }
    }

    // If no symbol, list all tokens
    if (!symbol) {
      const tokens = Array.from(allSymbols.values()).map((t) => ({
        symbol: t.symbol,
        ibcDenom: t.ibcDenom,
        decimals: t.decimals,
        networks: t.networks
      }));
      const result = JSON.stringify(tokens, null, 2);
      if (opts.outputFile) {
        const fs = await import('fs');
        fs.writeFileSync(opts.outputFile, result + '\n', 'utf-8');
        process.stderr.write(`Written to ${opts.outputFile}\n`);
      } else {
        console.log(result);
      }
      return;
    }

    const entry = allSymbols.get(symbol.toUpperCase());
    if (!entry) {
      console.error(`Unknown token "${symbol}". Known tokens: ${Array.from(allSymbols.keys()).join(', ')}`);
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
      networks: entry.networks,
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

// ── docs helpers ──────────────────────────────────────────────────────────────

// ── docs helpers ─────────────────────────────────────────────────────────────

import type { DocSection } from '../utils/docs-cache.js';

function findSection(tree: DocSection[], slugPath: string): DocSection | null {
  const parts = slugPath.toLowerCase().split('/');
  function searchExact(nodes: DocSection[], depth: number): DocSection | null {
    for (const node of nodes) {
      if (node.slug === parts[depth]) {
        if (depth === parts.length - 1) return node;
        if (node.children) {
          const deeper = searchExact(node.children, depth + 1);
          if (deeper) return deeper;
        }
      }
      if (node.children) {
        const found = searchExact(node.children, depth);
        if (found) return found;
      }
    }
    return null;
  }
  const exact = searchExact(tree, 0);
  if (exact) return exact;
  if (parts.length === 1) {
    const query = parts[0];
    function searchPartial(nodes: DocSection[]): DocSection | null {
      for (const node of nodes) {
        if (node.slug.includes(query) || query.includes(node.slug)) return node;
        if (node.children) {
          const found = searchPartial(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return searchPartial(tree);
  }
  return null;
}

function collectPaths(section: DocSection): string[] {
  const paths: string[] = [];
  if (section.path) paths.push(section.path);
  if (section.children) {
    for (const child of section.children) paths.push(...collectPaths(child));
  }
  return paths;
}

function printTree(sections: DocSection[], indent = 0): string {
  const lines: string[] = [];
  for (const s of sections) {
    const prefix = '  '.repeat(indent);
    lines.push(`${prefix}${s.slug.padEnd(28 - indent * 2)} ${s.title}`);
    if (s.children && indent < 1) {
      for (const child of s.children) {
        lines.push(`${'  '.repeat(indent + 1)}${child.slug.padEnd(26 - indent * 2)} ${child.title}`);
      }
    }
  }
  return lines.join('\n');
}

// ── sdk docs ───────────────────────────────────────────────────────────────────

sdkCommand
  .command('docs [section]')
  .description('Browse BitBadges documentation (fetched from GitHub, cached 24h)')
  .option('--refresh', 'Force refresh the docs cache')
  .addHelpText('after', `
Usage:
  sdk docs                    Show available sections (tree view)
  sdk docs all                Dump everything (full for-llms.txt)
  sdk docs <section>          Show specific section content
  sdk docs learn/approvals    Navigate deeper with slash paths
  sdk docs --refresh          Force refresh the cache

Docs are fetched from GitHub on first use and cached locally for 24 hours.
Cache location: ~/.bitbadges/docs-cache.json`)
  .action(async (section: string | undefined, opts: { refresh?: boolean }) => {
    const { loadDocs, clearDocsCache } = await import('../utils/docs-cache.js');

    if (opts.refresh) {
      clearDocsCache();
      process.stderr.write('Cache cleared.\n');
    }

    const docs = await loadDocs();

    if (!section) {
      console.log('BitBadges Documentation\n');
      console.log(printTree(docs.tree));
      console.log('\nUse "sdk docs <section>" to view content. "sdk docs all" for everything.');
      return;
    }

    if (section === 'all') {
      console.log(docs.fullText);
      return;
    }

    const found = findSection(docs.tree, section);
    if (!found) {
      console.error(`Section "${section}" not found. Run "sdk docs" to see available sections.`);
      process.exit(1);
    }

    const paths = collectPaths(found);
    if (paths.length === 0) {
      console.log(`Section "${found.title}" has no content files.`);
      if (found.children) {
        console.log('\nSub-sections:');
        for (const child of found.children) console.log(`  ${child.slug}    ${child.title}`);
      }
      return;
    }

    let out = '';
    for (const p of paths) {
      const content = docs.byPath[p];
      if (content) out += `\n## ${p}\n${content}\n`;
    }
    console.log(out.trim() || `No content found for "${section}".`);
  });

// ── sdk skills ─────────────────────────────────────────────────────────────────

sdkCommand
  .command('skills [skillId]')
  .description('List available MCP Builder skills or show a specific skill')
  .addHelpText('after', '\nRun "sdk skills" to list all. "sdk skills <id>" for details.\nSkills are fetched from docs (cached locally).')
  .action(async (skillId: string | undefined) => {
    const { loadDocs } = await import('../utils/docs-cache.js');
    const docs = await loadDocs();

    const skillsSection = findSection(docs.tree, 'mcp-builder-skills');
    if (!skillsSection || !skillsSection.children) {
      console.error('Skills section not found in docs. Try "sdk docs" to see available sections.');
      process.exit(1);
    }

    if (!skillId) {
      console.log('Available MCP Builder Skills:\n');
      for (const skill of skillsSection.children) {
        console.log(`  ${skill.slug.padEnd(24)} ${skill.title}`);
      }
      console.log('\nUse "sdk skills <id>" for full content.');
      return;
    }

    const skill = skillsSection.children.find((s) => s.slug === skillId);
    if (!skill) {
      console.error(`Skill "${skillId}" not found. Available skills:`);
      for (const s of skillsSection.children) console.error(`  ${s.slug}`);
      process.exit(1);
    }

    if (!skill.path) {
      console.error(`Skill "${skillId}" has no content path.`);
      process.exit(1);
    }

    const content = docs.byPath[skill.path];
    if (!content) {
      console.error(`No content found for skill "${skillId}".`);
      process.exit(1);
    }

    console.log(content.trim());
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

    // API key status (resolved for current network)
    const maskApiKey = (k: string | undefined): string => {
      if (!k) return '(not set)';
      return k.length <= 8 ? '****' : k.slice(0, 4) + '****' + k.slice(-4);
    };

    let apiKeyStatus = '(not set)';
    try {
      const key = resolveApiKey(undefined, network as 'mainnet' | 'testnet' | 'local');
      apiKeyStatus = maskApiKey(key);
    } catch {
      // No key configured
    }

    console.log('BitBadges CLI Status');
    console.log('====================');
    console.log(`  API Key:      ${apiKeyStatus}  (active for ${network})`);
    console.log(`  Network:      ${network}`);
    console.log(`  Base URL:     ${baseUrl}`);
    console.log(`  Config file:  ${configPath}`);
    console.log(`  Node.js:      ${process.version}`);

    // Show all configured API keys
    console.log('');
    console.log('API Keys:');
    console.log(`  apiKey:         ${maskApiKey(config.apiKey)}`);
    console.log(`  apiKeyTestnet:  ${maskApiKey(config.apiKeyTestnet)}`);
    console.log(`  apiKeyLocal:    ${maskApiKey(config.apiKeyLocal)}`);

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
