import { Collection } from 'discord.js';
import { fileURLToPath } from 'url';

import { Command, CommandGroup, Permissions } from './types.js';
import { directoryFiles } from './utilities.js';

const BOT_COMMANDS = new Collection<string, Command | CommandGroup>();

for (const commandPromise of directoryFiles<Command | CommandGroup>(fileURLToPath(import.meta.url), 'commands')) {

    const command = (await commandPromise).default;

    if (command.permission === Permissions.NOTVERIFIED)
        command.data.setDefaultPermission(true);
    else
        command.data.setDefaultPermission(false);

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;