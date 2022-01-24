import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('verify', 'Verifies a member', (_) => _, unimplementedCommandCallback());

export default command;