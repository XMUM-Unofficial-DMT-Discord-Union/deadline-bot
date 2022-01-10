import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('admin', 'Apply for admin role', (_) => _, unimplementedCommandCallback());

module.exports = command;