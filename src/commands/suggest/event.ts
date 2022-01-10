import { createSubCommand, unimplementedCommandCallback } from '../../utilities';

const command = createSubCommand('event', 'Suggest an event', (_) => _, unimplementedCommandCallback());

module.exports = command;