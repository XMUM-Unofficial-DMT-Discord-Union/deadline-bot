import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('add', 'Adds a deadline', (_) => _, unimplementedCommandCallback());

export default command;