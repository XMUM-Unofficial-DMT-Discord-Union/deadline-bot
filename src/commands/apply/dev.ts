import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('dev', 'Apply to be a bot developer', (_) => _, unimplementedCommandCallback());

export default command;