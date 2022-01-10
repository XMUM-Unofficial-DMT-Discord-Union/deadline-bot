import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('enroll', 'Enroll into a course', (_) => _, unimplementedCommandCallback());

module.exports = command;