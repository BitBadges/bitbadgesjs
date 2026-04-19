import { Command } from 'commander';
import { readJsonInput, output, getApiUrl } from '../utils/io.js';
import { loadConfig, getConfigPath } from '../utils/config.js';
import { resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';

export const sdkCommand = new Command('sdk').description('SDK analysis and utility commands');

// ── sdk review <input> ─────────────────────────────────────────────────────────

sdkCommand
  .command('review <input>')
  .description('Review a transaction or collection for issues via reviewCollection(). Input: JSON file, inline JSON, collection ID, or - for stdin')
  .option('--json', 'Output the full ReviewResult as JSON')
  .option('--human', 'Force human-readable text output (default)')
  .option('--strict', 'Exit 1 on warnings (critical always exits 2)')
  .option('--testnet', 'Use testnet API URL')
  .option('--local', 'Use local API URL (http://localhost:3001)')
  .option('--url <url>', 'Custom API base URL')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (input: string, opts: { json?: boolean; human?: boolean; strict?: boolean; testnet?: boolean; local?: boolean; url?: string; outputFile?: string }) => {
    let data;
    if (/^\d+$/.test(input)) {
      const baseUrl = getApiUrl(opts);
      const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
        headers: { 'x-api-key': process.env.BITBADGES_API_KEY || '' }
      });
      if (!response.ok) throw new Error(`Failed to fetch collection ${input}: HTTP ${response.status}`);
      data = await response.json();
    } else {
      data = readJsonInput(input);
    }

    const { reviewCollection } = await import('../../core/review.js');
    const result = reviewCollection(data);

    if (opts.json) {
      output(result, { ...opts, human: false });
    } else {
      // Human format — grouped by severity
      const lines: string[] = [];
      const byLevel: Record<string, typeof result.findings> = { critical: [], warning: [], info: [] };
      for (const f of result.findings) byLevel[f.severity].push(f);
      for (const level of ['critical', 'warning', 'info'] as const) {
        for (const f of byLevel[level]) {
          lines.push(`[${level.toUpperCase()}] ${f.code} — ${f.title.en}`);
          if (f.detail.en) lines.push(`  ${f.detail.en}`);
          if (f.recommendation.en) lines.push(`  -> ${f.recommendation.en}`);
        }
      }
      lines.push('');
      lines.push(
        `Summary: ${result.summary.critical} critical, ${result.summary.warning} warning, ${result.summary.info} info — verdict: ${result.summary.verdict}`
      );
      const text = lines.join('\n');
      if (opts.outputFile) {
        const fs = await import('fs');
        fs.writeFileSync(opts.outputFile, text + '\n', 'utf-8');
        process.stderr.write(`Written to ${opts.outputFile}\n`);
      } else {
        console.log(text);
      }
    }

    if (result.summary.critical > 0) process.exit(2);
    if (opts.strict && result.summary.warning > 0) process.exit(1);
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
    const { interpretCollection } = await import('../../api-indexer/interpret.js');
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

function printTree(sections: DocSection[], indent = 0, maxDepth = 4): string {
  const lines: string[] = [];
  for (const s of sections) {
    const prefix = '  '.repeat(indent);
    const hasChildren = s.children && s.children.length > 0;
    const marker = hasChildren ? '▸ ' : '  ';
    const pad = Math.max(2, 30 - indent * 2);
    lines.push(`${prefix}${marker}${s.slug.padEnd(pad)} ${s.title}`);
    if (hasChildren && indent < maxDepth) {
      lines.push(printTree(s.children!, indent + 1, maxDepth));
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
  sdk docs                              Show all sections as a navigable tree
  sdk docs all                          Dump full for-llms.txt (entire documentation)
  sdk docs <section>                    Show a top-level section and all its children
  sdk docs <section>/<subsection>       Drill into a specific subsection
  sdk docs <section>/<sub>/<sub>        Navigate as deep as needed with slashes
  sdk docs --refresh                    Force refresh the cached docs

Section Navigation (use slugs from the tree view, separated by /):
  sdk docs learn                        All learning material
  sdk docs learn/approval-criteria      Just the approval criteria section
  sdk docs learn/approval-criteria/merkle-challenges   A specific sub-topic
  sdk docs messages                     All message type docs
  sdk docs messages/msg-transfer-tokens A specific message
  sdk docs examples                     Code examples and snippets
  sdk docs builder-skills               All builder skills (same as "sdk skills")
  sdk docs builder-skills/smart-token   A specific skill

Partial matching: "sdk docs approvals" finds the first section containing "approvals".

Docs are fetched from GitHub on first use and cached locally for 24 hours.
Cache: ~/.bitbadges/docs-cache.json | Refresh: sdk docs --refresh`)
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
      console.log('\nNavigate with slashes: sdk docs learn/approval-criteria/merkle-challenges');
      console.log('Dump everything: sdk docs all');
      console.log('Partial match: sdk docs approvals (finds first match)');
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

// ── sdk skills (alias for sdk docs builder-skills) ──────────────────────

sdkCommand
  .command('skills [skillId]')
  .description('Shorthand for "sdk docs builder-skills" — list or show BitBadges Builder skills')
  .addHelpText('after', '\nEquivalent to: sdk docs builder-skills / sdk docs builder-skills/<id>')
  .action(async (skillId: string | undefined) => {
    // Delegate to the docs command logic. The slug must exist in the loaded
    // docs tree — coordinated with bitbadges-docs where this section is
    // published.
    const section = skillId ? `builder-skills/${skillId}` : 'builder-skills';
    sdkCommand.commands.find((c) => c.name() === 'docs')!.parseAsync(['node', 'docs', section]);
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
