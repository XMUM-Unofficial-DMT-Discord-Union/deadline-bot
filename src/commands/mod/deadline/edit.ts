import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('edit', 'Edits an existing deadline', (_) => _, unimplementedCommandCallback());

module.exports = command;