import { Command } from 'commander';

export const lookupCommand = new Command('lookup')
  .description('Look up token info by symbol — returns IBC denom, decimals, backing address, and supported networks. Omit symbol to list all tokens.')
  .argument('[symbol]', 'Token symbol (e.g. USDC, BADGE). Omit to list all known tokens.')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (symbol: string | undefined, opts: { outputFile?: string }) => {
    const { MAINNET_COINS_REGISTRY, TESTNET_COINS_REGISTRY } = await import('../../common/constants.js');

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
