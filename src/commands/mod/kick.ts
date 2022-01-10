import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('kick', 'Kicks a member', (_) => _, unimplementedCommandCallback());

module.exports = command;