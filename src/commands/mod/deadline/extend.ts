import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('extend', 'Extends an existing deadline', (_) => _, unimplementedCommandCallback());

export default command;