import { createCommandGroup } from '../utilities';

const command = createCommandGroup('admin', 'Admin related commands', __filename);

module.exports = command;