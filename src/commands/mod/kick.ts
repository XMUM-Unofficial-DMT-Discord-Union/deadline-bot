import { createSubCommand, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('kick', 'Kicks a member', (_) => _, unimplementedCommandCallback());

export default command;