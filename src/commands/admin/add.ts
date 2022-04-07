import { GuildMember } from "discord.js";

import { createSubCommand, GUILD } from "../../utilities.js";

const command = createSubCommand('add', 'Adds an admin',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to add as admin')
        .setRequired(true))
    , async (interaction) => {
        if (interaction.isAutocomplete()) throw `Command \`add\` does not have AutoComplete logic`;

        const targetMember = interaction.options.getMember('target_user') as GuildMember;

        const modId = (await GUILD.getModRole(interaction.guildId as string, interaction.client)).id;
        const adminId = (await GUILD.getAdminRole(interaction.guildId as string, interaction.client)).id;
        const verifiedId = (await GUILD.getVerifiedRole(interaction.guildId as string, interaction.client)).id;

        // If the member is not verified
        if (targetMember.roles.resolve(verifiedId) === null)
            await interaction.reply({ content: `${targetMember.displayName} is not verified!`, ephemeral: true });
        // If the member is not a mod
        else if (targetMember.roles.resolve(modId) === null)
            await interaction.reply({ content: `${targetMember.displayName} cannot be promoted to admin as he/she was not mod`, ephemeral: true });
        // If the member is already an admin
        else if (targetMember.roles.resolve(adminId) !== null)
            await interaction.reply({ content: `${targetMember.displayName} was already an admin!`, ephemeral: true });
        else if (targetMember.user.bot)
            await interaction.reply({ content: `${targetMember.displayName} is a bot, bots aren't able to be admins!`, ephemeral: true });
        else {
            await targetMember.roles.add(adminId);

            await GUILD.addRoleToStudent('ADMIN', interaction.user.id, interaction.guildId as string);

            await interaction.reply({ content: `${targetMember.displayName} has been promoted from mod to admin!`, ephemeral: true });
        }
    });

export default command;