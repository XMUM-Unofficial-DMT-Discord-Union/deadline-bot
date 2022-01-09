import { Client, Intents } from 'discord.js';

import { IEvent } from './types';
import directoryFiles from './utilities';


const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Dynamically read all event files
for (const event of directoryFiles<IEvent>(__filename, 'events')) {

    if (event.once)
        client.once(event.name, (...args) => event.execute(...args));
    else
        client.on(event.name, (...args) => event.execute(...args));
}

client.login(process.env.CLIENT_TOKEN as string);
