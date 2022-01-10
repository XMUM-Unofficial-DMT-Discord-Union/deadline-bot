import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('remove', 'Removes a course', (_) => _, unimplementedCommandCallback());

module.exports = command;