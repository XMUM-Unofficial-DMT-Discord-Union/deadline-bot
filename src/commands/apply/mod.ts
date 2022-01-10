import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('mod', 'Apply to be a moderator', (_) => _, unimplementedCommandCallback());

module.exports = command;