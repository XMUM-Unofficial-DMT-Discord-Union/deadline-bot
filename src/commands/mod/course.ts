import { createSubCommandGroup } from '../../utilities';

const command = createSubCommandGroup('course', 'Course related commands.', __filename);

module.exports = command;