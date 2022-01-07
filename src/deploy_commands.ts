import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import BOT_COMMANDS from './command_utilities';

const commands: any = [];

BOT_COMMANDS.each((command) => {
    commands.push(command.data.toJSON());
})

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

if (process.env.ENVIRONMENT == 'development') {
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(() => console.error());
} else if (process.env.ENVIRONMENT == 'production') {
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(() => console.error());
}