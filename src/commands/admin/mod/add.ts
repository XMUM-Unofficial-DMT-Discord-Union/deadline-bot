import { GuildMember } from "discord.js";

import { createSubCommand, GUILD } from "../../../utilities.js";

const command = createSubCommand('add', 'Adds a moderator',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to add as moderator')
        .setRequired(true))
    , async (interaction) => {
        const targetMember = interaction.options.getMember('target_user', true) as GuildMember;

        const modId = (await GUILD.getModRole(interaction.guildId as string, interaction.client)).id;
        const adminId = (await GUILD.getAdminRole(interaction.guildId as string, interaction.client)).id;
        const verifiedId = (await GUILD.getVerifiedRole(interaction.guildId as string, interaction.client)).id;

        // If the member is not verified
        if (targetMember.roles.resolve(verifiedId) === null)
            await interaction.reply({ content: `${targetMember.displayName} is not verified!`, ephemeral: true });
        // If the member is already a mod
        else if (targetMember.roles.resolve(modId) !== null)
            await interaction.reply({ content: `${targetMember.displayName} was already a mod!`, ephemeral: true });
        else if (targetMember.user.bot)
            await interaction.reply({ content: `${targetMember.displayName} is a bot, bots aren't able to be mods!`, ephemeral: true });
        else {
            await targetMember.roles.add(modId);

            await GUILD.addRoleToStudent('MOD', interaction.user.id, interaction.guildId as string);

            // If the member was ranked higher than a mod
            if (targetMember.roles.resolve(adminId) !== null) {
                await targetMember.roles.remove(adminId);

                await interaction.reply({ content: `${targetMember.displayName} has been demoted from admin to mod!`, ephemeral: true });
            } else
                await interaction.reply({ content: `${targetMember.displayName} has been added as a mod!`, ephemeral: true });
        }
    });

export default command;