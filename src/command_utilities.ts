import { SlashCommandBuilder } from '@discordjs/builders';
import { CacheType, Collection, Interaction } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Define the interface of each command
interface CommandInterface {
    data: SlashCommandBuilder,
    execute(interaction: Interaction<CacheType>): Promise<any>
}

const BOT_COMMANDS = new Collection<string, CommandInterface>();
const commandFiles = fs.readdirSync(`${path.dirname(__filename)}${path.sep}commands`).filter(file => file.endsWith(path.extname(__filename)));

for (const file of commandFiles) {
    const command: CommandInterface = require(`./commands/${file}`);

    // By default, only Adminstrators can see the commands
    command.data.setDefaultPermission(false);

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;