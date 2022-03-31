import { Client, Intents } from 'discord.js';

import { Event } from './types.js';
import { directoryFiles } from './utilities.js';
import { initializeScheduler } from './scheduler.js';
import { fileURLToPath } from 'url';
import discordModals from 'discord-modals';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES] });

discordModals(client);

// Dynamically read all event files
for (const eventPromise of directoryFiles<Event>(fileURLToPath(import.meta.url), 'events')) {

    const event = (await eventPromise).default;
    if (event.once)
        client.once(event.name, (...args) => event.execute(...args));
    else
        client.on(event.name, (...args) => event.execute(...args));
}

client.login(process.env.CLIENT_TOKEN as string);

await initializeScheduler(client);

export { client };