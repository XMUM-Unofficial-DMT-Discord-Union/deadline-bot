import { Permissions } from '../types';
import { createCommandGroup } from '../utilities';

const command = createCommandGroup('suggest', 'Suggestion related commands', Permissions.EVERYONE, __filename);

module.exports = command;