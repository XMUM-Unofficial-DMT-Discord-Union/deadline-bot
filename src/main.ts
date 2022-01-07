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

// Dynamically read all event files
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.ts'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once)
        bot.client.once(event.name, (...args) => event.execute(...args));
    else
        bot.client.on(event.name, (...args) => event.execute(...args));

}

bot.client.login(process.env.CLIENT_TOKEN as string);