import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('add', 'Adds a deadline', (_) => _, unimplementedCommandCallback());

module.exports = command;