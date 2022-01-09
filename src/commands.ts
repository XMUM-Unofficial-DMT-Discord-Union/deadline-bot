import { Collection } from 'discord.js';

import { ICommand } from './types';
import directoryFiles from './utilities';

const BOT_COMMANDS = new Collection<string, ICommand>();

for (const command of directoryFiles<ICommand>(__filename, 'commands')) {
    // By default, only Adminstrators can see the commands
    command.data.setDefaultPermission(false);

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;