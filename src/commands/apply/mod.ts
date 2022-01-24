import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('mod', 'Apply to be a moderator', (_) => _, unimplementedCommandCallback());

export default command;