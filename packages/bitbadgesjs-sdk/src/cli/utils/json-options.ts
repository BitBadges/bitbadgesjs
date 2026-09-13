import type { Command } from 'commander';

/** JSON is validated by the builder; flag-mode requirements still apply without it. */
export function allowJsonInsteadOfRequiredOptions(command: Command): void {
  const required = command.options.filter((option) => option.mandatory);
  for (const option of required) option.makeOptionMandatory(false);
  command.hook('preAction', () => {
    const options = command.opts();
    if (options.json !== undefined) {
      if (typeof options.json !== 'string' || !options.json.trim()) {
        command.error('error: --json requires a file, JSON object, or - for stdin', { code: 'commander.invalidArgument' });
      }
      return;
    }
    for (const option of required) {
      if (options[option.attributeName()] === undefined) {
        command.error(`error: required option '${option.flags}' not specified (or provide --json)`, {
          code: 'commander.missingMandatoryOption'
        });
      }
    }
  });
}
