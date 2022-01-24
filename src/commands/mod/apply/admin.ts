import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('admin', 'Apply for admin role', (_) => _, unimplementedCommandCallback());

export default command;