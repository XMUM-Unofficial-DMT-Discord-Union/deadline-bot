import { REST } from '@discordjs/rest';
import { ApplicationCommandPermissionType, RESTGetAPIGuildRolesResult, RESTPostAPIApplicationCommandsJSONBody, RESTPutAPIApplicationGuildCommandsResult, Routes } from 'discord-api-types/v9';
import { Permissions } from 'discord.js';
import BOT_COMMANDS from './commands';

const commandsJSON: RESTPostAPIApplicationCommandsJSONBody[] = [];

BOT_COMMANDS.each((command) => {
    commandsJSON.push(command.data.toJSON());
})

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

async function call() {
    // Bulk register each command
    let commands = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commandsJSON })
        .catch(error => {
            console.error('Registering application commands failed.');
            console.error(error);
        });
    console.log('Successfully registered application commands.');

    let permissions: object[] = [];

    let roles = await rest.get(Routes.guildRoles(process.env.GUILD_ID as string))
        .catch(error => {
            console.error('Fetching guild roles failed.');
            console.error(error);
        });

    for (const role of (roles as RESTGetAPIGuildRolesResult)) {

        // Check whether the role is for a bot and has admin permissions
        if ((BigInt(role.permissions) & Permissions.FLAGS.ADMINISTRATOR) && !role.managed) {
            // Allow this role to use the command
            permissions.push({
                id: role.id,
                type: ApplicationCommandPermissionType.Role,
                permission: true
            });

        }
    }

    // Now we have all roles with admin privileges - all commands should be able to be accessed by admins now
    await rest.put(Routes.guildApplicationCommandsPermissions(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), {
        body: (commands as RESTPutAPIApplicationGuildCommandsResult).map(command => {
            return {
                id: command.id,
                permissions: permissions
            }
        })
    })
        .then(() => console.log('Respective roles have been given permissions.'))
        .catch(error => {
            console.error('Setting permissions failed');
            console.error(error);
        });
}

call().then();