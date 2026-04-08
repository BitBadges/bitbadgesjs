#!/usr/bin/env node
import { Command } from 'commander';
import { sdkCommand } from './commands/sdk.js';
import { createApiCommand } from './commands/api.js';

const program = new Command();

program.name('bitbadges-cli').description('BitBadges CLI — SDK utilities and indexer API commands').version('0.1.0');

program.addCommand(sdkCommand);
program.addCommand(createApiCommand());

program.parse();
