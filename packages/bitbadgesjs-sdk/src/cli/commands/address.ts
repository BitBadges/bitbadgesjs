import { Command } from 'commander';

export const addressCommand = new Command('address').description('Address conversion and validation utilities.');

addressCommand
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

addressCommand
  .command('validate <address>')
  .description('Validate an address and detect its chain')
  .action(async (address: string) => {
    const { isAddressValid, getChainForAddress } = await import('../../address-converter/converter.js');

    const valid = isAddressValid(address);
    const chain = getChainForAddress(address);
    const chainLabel = chain === 'Cosmos' ? 'BitBadges' : chain === 'ETH' ? 'Ethereum' : 'Unknown';

    console.log(JSON.stringify({ valid, chain: chainLabel, address }, null, 2));
  });
