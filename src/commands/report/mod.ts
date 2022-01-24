import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('mod', 'Report a mod', (_) => _, unimplementedCommandCallback());

export default command;