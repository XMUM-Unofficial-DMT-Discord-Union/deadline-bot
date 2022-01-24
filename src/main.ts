import { Client, Intents } from 'discord.js';

import { Event } from './types';
import { directoryFiles } from './utilities';
import { initializeScheduler } from './scheduler';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './database';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES] });

// Dynamically read all event files
for (const event of directoryFiles<Event>(__filename, 'events')) {

    if (event.once)
        client.once(event.name, (...args) => event.execute(...args));
    else
        client.on(event.name, (...args) => event.execute(...args));
}

client.login(process.env.CLIENT_TOKEN as string);

onAuthStateChanged(auth, async user => {
    if (user !== null) {
        // Additionally, pass this client to the scheduler
        await initializeScheduler(client);
    }
}, error => console.log(error));