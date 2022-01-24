import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('add', 'Adds a course', (_) => _, unimplementedCommandCallback());

export default command;