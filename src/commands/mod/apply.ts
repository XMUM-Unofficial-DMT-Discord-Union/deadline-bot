import { createSubCommandGroup } from '../../utilities';

const command = createSubCommandGroup('apply', 'Application related commands.', __filename);

module.exports = command;