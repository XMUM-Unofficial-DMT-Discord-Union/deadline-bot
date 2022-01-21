import { Collection } from 'discord.js';

import { Command, CommandGroup, Permissions } from './types';
import { directoryFiles } from './utilities';

const BOT_COMMANDS = new Collection<string, Command | CommandGroup>();

for (const command of directoryFiles<Command | CommandGroup>(__filename, 'commands')) {

    switch (command.permission) {
        case undefined || Permissions.EVERYONE:
            // Everyone has access to these permissions
            command.data.setDefaultPermission(true);
            break;
        default:
            // Only Mods or Admins can access these
            command.data.setDefaultPermission(false);
            break;
    }

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;