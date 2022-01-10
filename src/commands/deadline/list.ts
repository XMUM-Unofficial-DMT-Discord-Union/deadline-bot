import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('list', 'List all deadlines associated with you', (_) => _, unimplementedCommandCallback());

module.exports = command;