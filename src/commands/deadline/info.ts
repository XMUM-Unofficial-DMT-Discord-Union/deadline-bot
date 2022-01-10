import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('info', 'Displays more information about a deadline', (_) => _, unimplementedCommandCallback());

module.exports = command;