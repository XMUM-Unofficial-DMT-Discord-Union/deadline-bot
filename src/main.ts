import fs from 'fs';

import { CacheType, Client, Collection, CommandInteraction, Intents } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

const bot = {
    client: new Client({ intents: [Intents.FLAGS.GUILDS] }),
    commands: new Collection<string, {
        data: SlashCommandBuilder,
        execute(interaction: CommandInteraction<CacheType>): Promise<void>
    }>()
};

const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    bot.commands.set(command.data.name, command);
}

bot.client.once('ready', () => {
    console.log('Ready!');
});

bot.client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = bot.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

bot.client.login(process.env.CLIENT_TOKEN as string);
