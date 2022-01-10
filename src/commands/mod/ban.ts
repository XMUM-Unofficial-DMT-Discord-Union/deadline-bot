import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('ban', 'Bans a member', (_) => _, unimplementedCommandCallback());

module.exports = command;