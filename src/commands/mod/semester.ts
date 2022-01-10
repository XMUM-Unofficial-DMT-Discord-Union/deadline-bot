import { createSubCommandGroup } from '../../utilities';

const command = createSubCommandGroup('semester', 'Semester related commands.', __filename);

module.exports = command;