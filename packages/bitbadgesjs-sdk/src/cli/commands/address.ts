import { Command } from 'commander';
import { addOutputOptions, emit, emitError } from '../utils/envelope.js';

export const addressCommand = new Command('address').description('Address conversion and validation utilities.');

addOutputOptions(
  addressCommand
    .command('convert <address>')
    .description('Convert an address between bb1 and 0x formats. Auto-detects target direction from the input if --to is omitted.')
    .option('--to <format>', 'Target format: bb1 or 0x. Default: opposite of the input.')
).action(async (address: string, opts: { to?: string; condensed?: boolean; outputFile?: string }) => {
  const { convertToBitBadgesAddress, convertToEthAddress } = await import('../../address-converter/converter.js');

  const to = opts.to ?? (address.startsWith('0x') ? 'bb1' : address.startsWith('bb') ? '0x' : '');
  if (to !== 'bb1' && to !== '0x') {
    emitError(new Error(`Could not infer target format from "${address}". Pass --to bb1 or --to 0x.`), {
      code: 'invalid_target',
      exitCode: 2
    });
  }

  const result = to === 'bb1' ? convertToBitBadgesAddress(address) : convertToEthAddress(address);
  if (!result) {
    emitError(new Error(`Could not convert "${address}". Verify it is a well-formed bb1.../0x... address.`), {
      code: 'invalid_address',
      exitCode: 2
    });
  }
  emit({ result, source: address, target: to }, opts);
});

addOutputOptions(
  addressCommand
    .command('validate <address>')
    .description('Validate an address and detect its chain. Exits 0 when valid, 2 when invalid — so scripts can branch on exit code.')
).action(async (address: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { isAddressValid, getChainForAddress } = await import('../../address-converter/converter.js');

  const valid = isAddressValid(address);
  const chain = getChainForAddress(address);
  const chainLabel = chain === 'Cosmos' ? 'BitBadges' : chain === 'ETH' ? 'Ethereum' : 'Unknown';

  emit({ valid, chain: chainLabel, address }, opts);
  if (!valid) process.exit(2);
});
