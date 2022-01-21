import { Permissions } from '../types';
import { createCommandGroup } from '../utilities';

const command = createCommandGroup('deadline', 'Deadline related commands', Permissions.EVERYONE, __filename);

module.exports = command;