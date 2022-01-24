
import { createSubCommand, unimplementedCommandCallback } from '../../../utilities.js';

const command = createSubCommand('end', 'Intiates semester end command lifecycles.', (_) => _, unimplementedCommandCallback());

export default command;