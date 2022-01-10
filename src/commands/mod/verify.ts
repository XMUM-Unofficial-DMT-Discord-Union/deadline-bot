import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('verify', 'Verifies a member', (_) => _, unimplementedCommandCallback());

module.exports = command;