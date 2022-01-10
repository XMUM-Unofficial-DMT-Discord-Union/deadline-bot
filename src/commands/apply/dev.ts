import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('dev', 'Apply to be a bot developer', (_) => _, unimplementedCommandCallback());

module.exports = command;