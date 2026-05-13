import { Command } from 'commander';

export const addressCommand = new Command('address').description('Address conversion and validation utilities.');

addressCommand
  .command('convert <address>')
  .description('Convert an address between bb1 and 0x formats. Auto-detects target direction from the input if --to is omitted.')
  .option('--to <format>', 'Target format: bb1 or 0x. Default: opposite of the input.')
  .action(async (address: string, opts: { to?: string }) => {
    const { convertToBitBadgesAddress, convertToEthAddress } = await import('../../address-converter/converter.js');

    const to = opts.to ?? (address.startsWith('0x') ? 'bb1' : address.startsWith('bb') ? '0x' : '');
    if (to !== 'bb1' && to !== '0x') {
      console.error(`Could not infer target format from "${address}". Pass --to bb1 or --to 0x.`);
      process.exit(2);
    }

    const result = to === 'bb1' ? convertToBitBadgesAddress(address) : convertToEthAddress(address);
    if (!result) {
      console.error(`Could not convert "${address}". Verify it is a well-formed bb1.../0x... address.`);
      process.exit(2);
    }
    console.log(result);
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
