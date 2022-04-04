import { Client, GatewayIntentBits } from 'discord.js';

import { Event } from './types.js';
import { directoryFiles } from './utilities.js';
import { initializeScheduler } from './scheduler.js';
import { fileURLToPath } from 'url';

const client = new Client({
    intents: [
        // Guilds
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,

        // Direct Messages
        GatewayIntentBits.DirectMessages,

        // General Messages 
        GatewayIntentBits.MessageContent
    ]
});

// Dynamically read all event files
for (const eventPromise of directoryFiles<Event>(fileURLToPath(import.meta.url), 'events')) {

    const event = (await eventPromise).default;
    if (event.once)
        client.once(event.name, (...args) => event.execute(...args));
    else
        client.on(event.name, (...args) => event.execute(...args));
}

// Debugging usage
client.on('debug', console.debug);

// Error handling
client.on('error', console.warn);

client.login(process.env.CLIENT_TOKEN as string);

await initializeScheduler(client);

export { client };