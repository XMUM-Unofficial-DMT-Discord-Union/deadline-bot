import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('list', 'List all deadlines associated with you', (_) => _, unimplementedCommandCallback());

export default command;