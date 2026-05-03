import { Command } from 'commander';

export const genListIdCommand = new Command('gen-list-id')
  .description('Generate a reserved address list ID from a set of addresses.')
  .argument('<addresses...>', 'One or more addresses to include in the list')
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
