import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('aboutme', 'Information about the developer', (_) => _, unimplementedCommandCallback());

export default command;