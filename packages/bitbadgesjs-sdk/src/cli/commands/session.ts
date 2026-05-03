import { Command } from 'commander';
import {
  listSessionFilesOnDisk,
  readSessionFileRaw,
  resetSessionFile,
  sessionFilePath
} from '../../builder/session/fileStore.js';

export const sessionCommand = new Command('session')
  .description('Inspect, dump, or reset persisted builder sessions (under ~/.bitbadges/sessions/).');

sessionCommand
  .command('list')
  .description('List persisted session ids under ~/.bitbadges/sessions/.')
  .action(() => {
    for (const id of listSessionFilesOnDisk()) {
      process.stdout.write(id + '\n');
    }
  });

sessionCommand
  .command('show <id>')
  .description('Print a session snapshot as JSON.')
  .action((id: string) => {
    const raw = readSessionFileRaw(id);
    if (raw === null) {
      process.stderr.write(`No session file at ${sessionFilePath(id)}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(raw);
  });

sessionCommand
  .command('reset <id>')
  .description('Delete a persisted session file.')
  .action((id: string) => {
    resetSessionFile(id);
  });
