import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('add', 'Adds a course', (_) => _, unimplementedCommandCallback());

module.exports = command;