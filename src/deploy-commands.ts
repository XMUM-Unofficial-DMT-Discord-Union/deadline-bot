import fs from 'fs';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const commands = [];
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    commands.push(command.data.toJSON());
}


const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(() => console.error());