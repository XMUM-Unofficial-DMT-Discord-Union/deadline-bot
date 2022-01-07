import { SlashCommandBuilder } from '@discordjs/builders';
import { CacheType, Collection, Interaction } from 'discord.js';
import fs from 'fs';

// Define the interface of each command
interface CommandInterface {
    data: SlashCommandBuilder,
    execute(interaction: Interaction<CacheType>): Promise<any>
}

const BOT_COMMANDS = new Collection<string, CommandInterface>();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const command: CommandInterface = require(`./commands/${file}`);

    BOT_COMMANDS.set(command.data.name, command);
}

export default BOT_COMMANDS;