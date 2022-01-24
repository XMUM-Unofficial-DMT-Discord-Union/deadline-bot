import { REST } from '@discordjs/rest';
import { ApplicationCommandPermissionType, RESTGetAPIGuildRolesResult, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIGuildRoleResult, RESTPutAPIApplicationGuildCommandsResult, Routes } from 'discord-api-types/v9';

import BOT_COMMANDS from './commands.js';
import { Guild } from './models/guild.js';
import { Permissions } from './types.js';

const commandsJSON: RESTPostAPIApplicationCommandsJSONBody[] = [];

BOT_COMMANDS.each((command) => {
    commandsJSON.push(command.data.toJSON());
})

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

// Bulk register each command
let commands = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commandsJSON })
    .catch(error => {
        console.error('Registering application commands failed.');
        console.error(error);
    });
console.log('Successfully registered application commands.');

let permissions: any[] = [];

// Before fetching guild roles, check whether we have stored it in database
const guild = await Guild.get(process.env.GUILD_ID as string);

if (!guild.exists()) {
    // If guild does not exist in the database, we, by default find:
    // 1) Role with the name "Admins"
    // 2) Role with the name "Mods"
    // Otherwise, we create the missing roles respectively
    let guildRoles = await rest.get(Routes.guildRoles(process.env.GUILD_ID as string)).catch(error => 'error');

    let adminFound = false;
    let modFound = false;

    if (typeof guildRoles !== 'string') {
        for (let role of guildRoles as RESTGetAPIGuildRolesResult) {
            if (adminFound && modFound)
                break;
            if (!adminFound && role.name === 'Admins') {
                guild.updateAdminRoleId(role.id);
                adminFound = true;
            }
            if (!modFound && role.name === 'Mods') {
                guild.updateModRoleId(role.id);
                modFound = true;
            }
        }

        if (!adminFound) {
            // Missing admin role - create 
            let result = await rest.post(Routes.guildRoles(process.env.GUILD_ID as string), {
                body: {
                    name: 'Admins',
                    hoist: true
                }
            });

            guild.updateAdminRoleId((result as RESTPostAPIGuildRoleResult).id);
        }

        if (!modFound) {
            // Missing admin role - create 
            let result = await rest.post(Routes.guildRoles(process.env.GUILD_ID as string), {
                body: {
                    name: 'Mods',
                    hoist: true
                }
            });

            guild.updateModRoleId((result as RESTPostAPIGuildRoleResult).id);
        }

        // Commit these changes to the database
        await guild.save();
    }

}

// Now we have ensured that the guild exists, we can fetch admin and mod roles
const adminId = (await guild.getAdminRoleDetails()).id;
const modId = (await guild.getModRoleDetails()).id;

// Now we associate a command to an id, and the respective permission
for (let command of BOT_COMMANDS.entries()) {
    const object = (commands as RESTPutAPIApplicationGuildCommandsResult).find(value => value.name === command[0]);

    // Ensure this is not everyone can access
    if (command[1].permission !== undefined && command[1].permission !== Permissions.EVERYONE) {
        permissions.push({
            id: object?.id,
            permissions: []
        });

        // If the command permits only Admin members - Only Admin can access
        if (command[1].permission === Permissions.ADMIN) {
            permissions[permissions.length - 1].permissions.push({
                id: adminId,
                type: ApplicationCommandPermissionType.Role,
                permission: true
            });
        }
        // if the command permits mod members - Admin and Mod can access
        else if (command[1].permission === Permissions.MOD) {
            permissions[permissions.length - 1].permissions.push({
                id: adminId,
                type: ApplicationCommandPermissionType.Role,
                permission: true
            });
            permissions[permissions.length - 1].permissions.push({
                id: modId,
                type: ApplicationCommandPermissionType.Role,
                permission: true
            });
        }
    }
}

// Now we have all roles with admin privileges - all commands should be able to be accessed by admins now
await rest.put(Routes.guildApplicationCommandsPermissions(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), {
    body: permissions
})
    .then(() => console.log('Respective roles have been given permissions.'))
    .catch(error => {
        console.error('Setting permissions failed');
        console.error(error);
    });