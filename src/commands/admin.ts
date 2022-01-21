import { Permissions } from '../types';
import { createCommandGroup } from '../utilities';

const command = createCommandGroup('admin', 'Admin related commands', Permissions.ADMIN, __filename);

module.exports = command;