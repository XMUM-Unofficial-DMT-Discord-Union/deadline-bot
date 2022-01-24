import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('enroll', 'Enroll into a course', (_) => _, unimplementedCommandCallback());

export default command;