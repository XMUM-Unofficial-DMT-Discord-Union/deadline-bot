import { createSubCommandGroup } from '../../utilities';

const command = createSubCommandGroup('deadline', 'Kicks a member', __filename);

module.exports = command;