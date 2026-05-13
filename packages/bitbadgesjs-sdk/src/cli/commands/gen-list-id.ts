import { Command } from 'commander';

export const genListIdCommand = new Command('gen-list-id')
  .description('Generate a reserved address list ID from a set of addresses.')
  .argument('<addresses...>', 'One or more addresses to include in the list')
  .option('--blacklist', 'Treat as blacklist (default is whitelist)')
  .action(async (addresses: string[], opts: { blacklist?: boolean }) => {
    const { generateReservedListId } = await import('../../core/addressLists.js');
    const { isAddressValid } = await import('../../address-converter/converter.js');

    // Validate every input is a well-formed address. The underlying
    // generateReservedListId() falls back to the raw string for invalid
    // inputs — silently emitting nonsense like "alice:charlie" as a list ID
    // that the chain will reject. Fail loud here so agents catch typos at
    // the CLI boundary.
    const invalid = addresses.filter((a) => !isAddressValid(a));
    if (invalid.length > 0) {
      console.error(
        `error: invalid address(es): ${invalid.join(', ')}. Expected bb1... or 0x... format.`,
      );
      process.exit(2);
    }

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
