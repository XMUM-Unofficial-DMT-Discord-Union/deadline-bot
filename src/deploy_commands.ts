import { REST } from '@discordjs/rest';
import { assert } from 'console';
import { ApplicationCommandPermissionType, RESTGetAPICurrentUserGuildsResult, RESTGetAPIGuildRolesResult, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIGuildRoleResult, RESTPutAPIApplicationGuildCommandsResult, Routes } from 'discord-api-types/v9';
import { exit } from 'process';

import BOT_COMMANDS from './commands.js';
import { Permissions } from './types.js';
import { GUILD } from './utilities.js';

const commandsJSON: RESTPostAPIApplicationCommandsJSONBody[] = [];

BOT_COMMANDS.each((command) => {
    commandsJSON.push(command.data.toJSON());
});

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

let guilds = await rest.get(Routes.userGuilds()) as RESTGetAPICurrentUserGuildsResult;

let devGuild = guilds.find(guild => guild.id === '778117614215495701');

if (devGuild === undefined) {
    console.error('Development guild cannot be found. Please check deploy_commands.ts');
    exit(1);
}

if (process.env.ENVIRONMENT === 'production')
    guilds = guilds.filter(guild => guild.id !== devGuild?.id);
else
    guilds = [devGuild];

for (let guild of guilds) {
    console.log(`Initializing commands for guild: \`${guild.name}\`, id: ${guild.id}`);

    // Bulk register each command
    let commands = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commandsJSON })
        .catch(error => {
            console.error('Registering application commands failed.');
            console.error(error);
        });
    console.log('Successfully registered guild commands.');

    let permissions: any[] = [];

    // Before fetching guild roles, check whether we have stored it in database
    if (!await GUILD.guildExists(guild.id)) {
        console.log('Guild does not exist in database. Fetching/Creating roles...');
        // If guild does not exist in the database, we, by default find:
        // 1) Role with the name "Devs"
        // 2) Role with the name "Admins"
        // 3) Role with the name "Mods"
        // 4) Role with the name "Verified"
        // Otherwise, we create the missing roles respectively
        let guildRoles = await rest.get(Routes.guildRoles(guild.id)).catch(error => {
            console.error(`Error fetching guild roles of id ${guild.id}.`);
            exit(1);
        }) as RESTGetAPIGuildRolesResult;

        let roleIds = {
            adminRoleId: '',
            modRoleId: '',
            verifiedRoleId: '',
            devRoleId: ''
        };

        let devFound = false;
        let adminFound = false;
        let modFound = false;
        let verifiedFound = false;

        for (let role of guildRoles as RESTGetAPIGuildRolesResult) {
            if (adminFound && modFound && verifiedFound && devFound)
                break;
            if (!devFound && role.name === 'Devs') {
                roleIds.devRoleId = role.id;
                devFound = true;
            }
            if (!adminFound && role.name === 'Admins') {
                roleIds.adminRoleId = role.id;
                adminFound = true;
            }
            if (!modFound && role.name === 'Mods') {
                roleIds.modRoleId = role.id;
                modFound = true;
            }
            if (!verifiedFound && role.name === 'Verified') {
                roleIds.verifiedRoleId = role.id;
                verifiedFound = true;
            }
        }

        if (!devFound) {
            // Missing admin role - create 
            let result = await rest.post(Routes.guildRoles(guild.id), {
                body: {
                    name: 'Devs',
                    hoist: true
                }
            }) as RESTPostAPIGuildRoleResult;

            roleIds.devRoleId = result.id;
        }

        if (!adminFound) {
            // Missing dev role - create 
            let result = await rest.post(Routes.guildRoles(guild.id), {
                body: {
                    name: 'Admins',
                    hoist: true
                }
            }) as RESTPostAPIGuildRoleResult;

            roleIds.adminRoleId = result.id;
        }

        if (!modFound) {
            // Missing admin role - create 
            let result = await rest.post(Routes.guildRoles(guild.id), {
                body: {
                    name: 'Mods',
                    hoist: true
                }
            }) as RESTPostAPIGuildRoleResult;

            roleIds.modRoleId = result.id;
        }

        if (!verifiedFound) {
            // Missing verified role - create
            let result = await rest.post(Routes.guildRoles(guild.id), {
                body: {
                    name: 'Verified'
                }
            }) as RESTPostAPIGuildRoleResult;

            roleIds.verifiedRoleId = result.id;
        }

        // Now roles have been successfully fetched/created: push into database
        await GUILD.createGuild({ id: guild.id, ...roleIds });

        console.log('Guilds along with roles have been pushed into database!');
    }

    // Now we have ensured that the guild exists, but roles might not exists anymore: create/fetch roles
    // TODO: Simplify so that we don't end up in try-catch hell
    let devId = '';
    try {
        devId = (await GUILD.getDevRole(guild.id)).id;
    } catch (_) {
        let result = await rest.post(Routes.guildRoles(guild.id), {
            body: {
                name: 'Devs',
                hoist: true
            }
        }) as RESTPostAPIGuildRoleResult;
        devId = (await GUILD.createDevRole(guild.id, result.id)).id;
    }
    let adminId = '';
    try {
        adminId = (await GUILD.getAdminRole(guild.id)).id;
    } catch (_) {
        let result = await rest.post(Routes.guildRoles(guild.id), {
            body: {
                name: 'Admins',
                hoist: true
            }
        }) as RESTPostAPIGuildRoleResult;
        adminId = (await GUILD.createAdminRole(guild.id, result.id)).id;
    }
    let modId = '';
    try {
        modId = (await GUILD.getModRole(guild.id)).id;
    } catch (_) {
        let result = await rest.post(Routes.guildRoles(guild.id), {
            body: {
                name: 'Mods',
                hoist: true
            }
        }) as RESTPostAPIGuildRoleResult;
        modId = (await GUILD.createModRole(guild.id, result.id)).id;
    }
    let verifiedId = '';
    try {
        verifiedId = (await GUILD.getVerifiedRole(guild.id)).id;
    } catch (_) {
        let result = await rest.post(Routes.guildRoles(guild.id), {
            body: {
                name: 'Verified',
                hoist: true
            }
        }) as RESTPostAPIGuildRoleResult;
        verifiedId = (await GUILD.createVerifiedRole(guild.id, result.id)).id;
    }

    // Now we associate a command to an id, and the respective permission
    for (let command of BOT_COMMANDS.entries()) {
        const object = (commands as RESTPutAPIApplicationGuildCommandsResult).find(value => value.name === command[0]);

        permissions.push({
            id: object?.id,
            permissions: []
        });

        // If the command permits only Dev members - Only Dev can access
        if (command[1].permission === Permissions.DEV) {
            permissions[permissions.length - 1].permissions.push({
                id: devId,
                type: ApplicationCommandPermissionType.Role,
                permission: true
            });
        }
        // If the command permits only Admin members - Only Admin can access
        else if (command[1].permission === Permissions.ADMIN) {
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
    await rest.put(Routes.guildApplicationCommandsPermissions(process.env.CLIENT_ID as string, guild.id), {
        body: permissions
    })
        .then(() => console.log('Respective roles have been given permissions.'))
        .catch(error => {
            console.error('Setting permissions failed');
            console.error(error);
        });
}