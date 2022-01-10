import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('delete', 'Deletes a deadline', (_) => _, unimplementedCommandCallback());

module.exports = command;