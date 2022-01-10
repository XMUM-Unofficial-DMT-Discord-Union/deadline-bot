import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection } from 'discord.js';

import { Command, CommandGroup } from './types';
import { directoryFiles } from './utilities';

const BOT_COMMANDS = new Collection<string, Command | CommandGroup>();

for (const command of directoryFiles<Command | CommandGroup>(__filename, 'commands')) {
    // By default, only Adminstrators can see the commands
    command.data.setDefaultPermission(false);

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;