import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('edit', 'Edits an existing deadline', (_) => _, unimplementedCommandCallback());

export default command;