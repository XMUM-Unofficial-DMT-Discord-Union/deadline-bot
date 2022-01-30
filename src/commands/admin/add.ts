import { GuildMember } from "discord.js";

import { createSubCommand, GUILD } from "../../utilities.js";

const command = createSubCommand('add', 'Adds an admin',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to add as admin')
        .setRequired(true))
    , async (interaction) => {
        const targetMember = interaction.options.getMember('target_user', true) as GuildMember;

        const modId = GUILD.getModRoleDetails().id;
        const adminId = GUILD.getAdminRoleDetails().id;
        const verifiedId = GUILD.getVerifiedRoleDetails().id;

        // If the member is not verified
        if (targetMember.roles.resolve(verifiedId) === null)
            await interaction.reply({ content: `${targetMember.displayName} is not verified!`, ephemeral: true })
        // If the member is not a mod
        else if (targetMember.roles.resolve(modId) === null)
            await interaction.reply({ content: `${targetMember.displayName} cannot be promoted to admin as he/she was not mod`, ephemeral: true })
        // If the member is already an admin
        else if (targetMember.roles.resolve(adminId) !== null)
            await interaction.reply({ content: `${targetMember.displayName} was already an admin!`, ephemeral: true })
        else if (targetMember.user.bot)
            await interaction.reply({ content: `${targetMember.displayName} is a bot, bots aren't able to be admins!`, ephemeral: true })
        else {
            await targetMember.roles.add(adminId);

            GUILD.addRoleToStudent('admin', interaction.user.id);
            await GUILD.save();

            await interaction.reply({ content: `${targetMember.displayName} has been promoted from mod to admin!`, ephemeral: true })
        }
    })

export default command;