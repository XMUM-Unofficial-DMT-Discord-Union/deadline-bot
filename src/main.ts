import fs from 'fs';
import path from 'path';

import { Client, Intents } from 'discord.js';

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Dynamically read all event files
const eventFiles = fs.readdirSync(`${path.dirname(__filename)}${path.sep}events`).filter(file => file.endsWith(path.extname(__filename)));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once)
        client.once(event.name, (...args) => event.execute(...args));
    else
        client.on(event.name, (...args) => event.execute(...args));
}

client.login(process.env.CLIENT_TOKEN as string);
