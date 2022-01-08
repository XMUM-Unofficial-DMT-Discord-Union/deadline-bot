import { REST } from '@discordjs/rest';
import { ApplicationCommandPermissionType, Routes } from 'discord-api-types/v9';
import { Permissions } from 'discord.js';
import BOT_COMMANDS from './command_utilities';

const commands: any = [];

BOT_COMMANDS.each((command) => {
    commands.push(command.data.toJSON());
})

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN as string);

// Bulk register each command
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(() => console.error());


// Also each command should be accessible to admins
// First get each command's id
rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string))
    .then(commands => {

        const permissions: object[] = [];

        rest.get(Routes.guildRoles(process.env.GUILD_ID as string))
            .then(roles => {
                for (const role of (roles as Array<any>)) {

                    // Check whether the role is for a bot and has admin permissions
                    if ((BigInt(role.permissions) & Permissions.FLAGS.ADMINISTRATOR) && (!('tags' in role) || ('tags' in role && !('bot_id' in role.tags)))) {
                        console.log(`${role.name} has admin permissions!`);

                        // Allow this role to use the command
                        permissions.push({
                            id: role.id,
                            type: ApplicationCommandPermissionType.Role,
                            permission: true
                        });

                    }
                }

                // Now we have all roles with admin privileges - all commands should be able to be accessed by admins now
                rest.put(Routes.guildApplicationCommandsPermissions(process.env.CLIENT_ID as string, process.env.GUILD_ID as string), {
                    body: (commands as Array<any>).map(command => {
                        return {
                            id: command.id,
                            permissions: permissions
                        }
                    })
                })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));

    })
    .catch(error => console.error(error));

