import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('event', 'Suggest an event', (_) => _, unimplementedCommandCallback());

export default command;