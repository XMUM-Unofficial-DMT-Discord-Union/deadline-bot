import { GuildMember } from "discord.js";

import { createSubCommand, GUILD } from "../../../utilities.js";

const command = createSubCommand('add', 'Adds a moderator',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to add as moderator')
        .setRequired(true))
    , async (interaction) => {
        const targetMember = interaction.options.getMember('target_user', true) as GuildMember;

        const modId = GUILD.getModRoleDetails().id;
        const adminId = GUILD.getAdminRoleDetails().id;

        // If the member is not verified
        if (targetMember.roles.resolve('922799498080690217') === null)
            await interaction.reply({ content: `${targetMember.displayName} is not verified!`, ephemeral: true })
        // If the member is already a mod
        else if (targetMember.roles.resolve(modId) !== null)
            await interaction.reply({ content: `${targetMember.displayName} was already a mod!`, ephemeral: true })
        else if (targetMember.user.bot)
            await interaction.reply({ content: `${targetMember.displayName} is a bot, bots aren't able to be mods!`, ephemeral: true })
        else {
            await targetMember.roles.add(modId);

            // If the member was ranked higher than a mod
            if (targetMember.roles.resolve(adminId) !== null) {
                await targetMember.roles.remove(adminId);

                await interaction.reply({ content: `${targetMember.displayName} has been demoted from admin to mod!`, ephemeral: true })
            } else
                await interaction.reply({ content: `${targetMember.displayName} has been added as a mod!`, ephemeral: true })
        }
    })

export default command;