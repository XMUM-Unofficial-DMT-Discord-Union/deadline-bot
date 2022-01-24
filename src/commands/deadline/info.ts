import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('info', 'Displays more information about a deadline', (_) => _, unimplementedCommandCallback());

export default command;