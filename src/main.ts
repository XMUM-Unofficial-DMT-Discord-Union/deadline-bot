import fs from 'fs';
import path from 'path';

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
const eventFiles = fs.readdirSync(`${path.dirname(__filename)}${path.sep}events`).filter(file => file.endsWith(path.extname(__filename)));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once)
        bot.client.once(event.name, (...args) => event.execute(...args));
    else
        bot.client.on(event.name, (...args) => event.execute(...args));

}

bot.client.login(process.env.CLIENT_TOKEN as string);