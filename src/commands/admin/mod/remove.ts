import { GuildMember } from "discord.js";
import { Guild } from "../../../models/guild.js";
import { createSubCommand } from "../../../utilities.js";

const command = createSubCommand('remove', 'Removes a moderator',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to remove from being a mod')
        .setRequired(true)), async interaction => {
            const targetMember = interaction.options.getMember('target_user', true) as GuildMember;

            // First get guild
            const guild = await Guild.get(process.env.GUILD_ID as string);

            const modId = (await guild.getModRoleDetails()).id;
            const adminId = (await guild.getAdminRoleDetails()).id;

            // If the member is not a mod
            if (targetMember.roles.resolve(modId) === null)
                await interaction.reply({ content: `${targetMember.displayName} was not a mod!`, ephemeral: true })
            else {
                await targetMember.roles.remove(modId);

                await interaction.reply({ content: `${targetMember.displayName} has been removed from being a mod!`, ephemeral: true })
            }
        })

export default command;