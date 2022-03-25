import { REST } from '@discordjs/rest';
import { ApplicationCommandPermissionType, RESTGetAPIGuildRolesResult, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIGuildRoleResult, RESTPutAPIApplicationGuildCommandsResult, Routes } from 'discord-api-types/v9';

import BOT_COMMANDS from './commands.js';
import { Permissions } from './types.js';
import { GUILD } from './utilities.js';

const commandsJSON: RESTPostAPIApplicationCommandsJSONBody[] = [];

BOT_COMMANDS.each((command) => {
    commandsJSON.push(command.data.toJSON());
});

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

// Bulk register each command
let commands = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commandsJSON })
    .catch(error => {
        console.error('Registering application commands failed.');
        console.error(error);
    });
console.log('Successfully registered application commands.');

let permissions: any[] = [];


// TODO: Lazy create roles instead of pre-emptively check and create upon load

// Before fetching guild roles, check whether we have stored it in database
if (!GUILD.exists()) {
    // If guild does not exist in the database, we, by default find:
    // 1) Role with the name "Admins"
    // 2) Role with the name "Mods"
    // 3) Role with the name "Verified"
    // Otherwise, we create the missing roles respectively
    let guildRoles = await rest.get(Routes.guildRoles(process.env.GUILD_ID as string)).catch(error => 'error');

    let adminFound = false;
    let modFound = false;
    let verifiedFound = false;

    if (typeof guildRoles !== 'string') {
        for (let role of guildRoles as RESTGetAPIGuildRolesResult) {
            if (adminFound && modFound)
                break;
            if (!adminFound && role.name === 'Admins') {
                await GUILD.updateAdminRoleId(await GUILD.getAdminRole(), role.id);
                adminFound = true;
            }
            if (!modFound && role.name === 'Mods') {
                await GUILD.updateModRoleId(await GUILD.getModRole(), role.id);
                modFound = true;
            }
            if (!verifiedFound && role.name === 'Verified') {
                await GUILD.updateVerifiedRoleId(await GUILD.getVerifiedRole(), role.id);
                verifiedFound = true;
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

            GUILD.updateAdminRoleId(await GUILD.getAdminRole(), (result as RESTPostAPIGuildRoleResult).id);
        }

        if (!modFound) {
            // Missing admin role - create 
            let result = await rest.post(Routes.guildRoles(process.env.GUILD_ID as string), {
                body: {
                    name: 'Mods',
                    hoist: true
                }
            });

            GUILD.updateModRoleId(await GUILD.getModRole(), (result as RESTPostAPIGuildRoleResult).id);
        }

        if (!verifiedFound) {
            // Missing verified role - create
            let result = await rest.post(Routes.guildRoles(process.env.GUILD_ID as string), {
                body: {
                    name: 'Verified'
                }
            });

            GUILD.updateVerifiedRoleId(await GUILD.getVerifiedRole(), (result as RESTPostAPIGuildRoleResult).id);
        }
    }
}

// Now we have ensured that the guild exists, we can fetch admin and mod roles
const adminId = (await GUILD.getAdminRole()).id;
const modId = (await GUILD.getModRole()).id;
const verifiedId = (await GUILD.getVerifiedRole()).id;

// Now we associate a command to an id, and the respective permission
for (let command of BOT_COMMANDS.entries()) {
    const object = (commands as RESTPutAPIApplicationGuildCommandsResult).find(value => value.name === command[0]);

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

    // if the command permits only non-verified members - Only unverified members can access
    else if (command[1].permission === Permissions.NOTVERIFIED) {
        permissions[permissions.length - 1].permissions.push({
            id: verifiedId,
            type: ApplicationCommandPermissionType.Role,
            permission: false
        });
    }

    // Otherwise, open the command for everyone that's verified
    else {
        permissions[permissions.length - 1].permissions.push({
            id: verifiedId,
            type: ApplicationCommandPermissionType.Role,
            permission: true
        });
    }
}

// Now we have all roles with the correct privileges - all commands should be able to be accessed by admins now
await rest.put(Routes.guildApplicationCommandsPermissions(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), {
    body: permissions
})
    .then(() => console.log('Respective roles have been given permissions.'))
    .catch(error => {
        console.error('Setting permissions failed');
        console.error(error);
    });