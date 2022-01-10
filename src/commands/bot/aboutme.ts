import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('aboutme', 'Information about the developer', (_) => _, unimplementedCommandCallback());

module.exports = command;