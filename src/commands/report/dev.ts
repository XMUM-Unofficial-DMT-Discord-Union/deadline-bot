import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('dev', 'Report an developer', (_) => _, unimplementedCommandCallback());

export default command;