import { createSubCommandGroup } from '../../utilities';

const command = createSubCommandGroup('mod', 'Mod related commands', __filename);

module.exports = command;