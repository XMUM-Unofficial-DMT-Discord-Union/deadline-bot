import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('mod', 'Report a mod', (_) => _, unimplementedCommandCallback());

module.exports = command;