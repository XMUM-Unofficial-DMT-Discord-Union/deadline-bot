
import { createSubCommand, unimplementedCommandCallback } from '../../../utilities';

const command = createSubCommand('start', 'Intiate semester start command lifecycles.', (_) => _, unimplementedCommandCallback());

module.exports = command;