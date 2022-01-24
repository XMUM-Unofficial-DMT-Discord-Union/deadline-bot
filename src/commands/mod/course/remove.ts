import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('remove', 'Removes a course', (_) => _, unimplementedCommandCallback());

export default command;