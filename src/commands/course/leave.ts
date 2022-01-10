import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('leave', 'Leave a course', (_) => _, unimplementedCommandCallback());

module.exports = command;