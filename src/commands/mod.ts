import { Permissions } from '../types';
import { createCommandGroup } from '../utilities';

const command = createCommandGroup('mod', 'Mod related commands', Permissions.MOD, __filename);

module.exports = command;