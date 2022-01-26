import { Collection } from 'discord.js';
import { fileURLToPath } from 'url';

import { Command, CommandGroup, Permissions } from './types.js';
import { directoryFiles } from './utilities.js';

const BOT_COMMANDS = new Collection<string, Command | CommandGroup>();

for (const commandPromise of directoryFiles<Command | CommandGroup>(fileURLToPath(import.meta.url), 'commands')) {

    const command = (await commandPromise).default;

    switch (command.permission) {
        case Permissions.ADMIN:
        case Permissions.MOD:
            // Only Mods or Admins can access these
            command.data.setDefaultPermission(false);
            break;
        default:
            // Only Mods or Admins can access these
            command.data.setDefaultPermission(true);
            break;
    }

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;