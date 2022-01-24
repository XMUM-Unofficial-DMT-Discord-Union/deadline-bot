
import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('start', 'Intiate semester start command lifecycles.', (_) => _, unimplementedCommandCallback());

export default command;