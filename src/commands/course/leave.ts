import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('leave', 'Leave a course', (_) => _, unimplementedCommandCallback());

export default command;