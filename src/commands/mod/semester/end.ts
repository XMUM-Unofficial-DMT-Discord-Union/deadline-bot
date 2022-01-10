
import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('end', 'Intiates semester end command lifecycles.', (_) => _, unimplementedCommandCallback());

module.exports = command;