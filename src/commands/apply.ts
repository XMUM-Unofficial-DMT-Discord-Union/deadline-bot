import { Permissions } from '../types';
import { createCommandGroup } from '../utilities';

const command = createCommandGroup('apply', 'Application related commands', Permissions.EVERYONE, __filename);

module.exports = command;