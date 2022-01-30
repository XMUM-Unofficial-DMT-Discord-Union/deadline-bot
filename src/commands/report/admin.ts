import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('admin', 'Report an admin', (_) => _, unimplementedCommandCallback());

export default command;