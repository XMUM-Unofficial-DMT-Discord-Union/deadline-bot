import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('extend', 'Extends an existing deadline', (_) => _, unimplementedCommandCallback());

module.exports = command;