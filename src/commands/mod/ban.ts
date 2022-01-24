import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('ban', 'Bans a member', (_) => _, unimplementedCommandCallback());

export default command;