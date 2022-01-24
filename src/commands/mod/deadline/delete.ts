import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('delete', 'Deletes a deadline', (_) => _, unimplementedCommandCallback());

export default command;