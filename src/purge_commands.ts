import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string))
    .then(commands => {
        for (const command of (commands as Array<any>)) {
            rest.delete(Routes.applicationGuildCommand(process.env.CLIENT_ID as string, process.env.GUILD_ID as string, command.id))
                .then(() => {
                    console.log(`deleted ${command.name}`);
                })
                .catch(error => {
                    console.error(error);
                });
        }
    })
    .catch(error => {
        console.error(error);
    });