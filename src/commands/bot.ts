import { Permissions } from '../types';
import { createCommandGroup } from '../utilities';

const command = createCommandGroup('bot', 'Bot related commands.', Permissions.EVERYONE, __filename);

module.exports = command;