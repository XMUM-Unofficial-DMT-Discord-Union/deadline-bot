import { GuildMember } from "discord.js";

import { createSubCommand, GUILD } from "../../utilities.js";

const command = createSubCommand('remove', 'Removes an admin',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to remove from being an admin')
        .setRequired(true)), async interaction => {
            const targetMember = interaction.options.getMember('target_user', true) as GuildMember;

            const adminId = (await GUILD.getAdminRole()).id;

            // If the member is not an admin 
            if (targetMember.roles.resolve(adminId) === null)
                await interaction.reply({ content: `${targetMember.displayName} was not a mod!`, ephemeral: true });
            else {
                await targetMember.roles.remove(adminId);

                await GUILD.removeRoleFromStudent('ADMIN', interaction.user.id, interaction.guildId as string);

                await interaction.reply({ content: `${targetMember.displayName} has been removed from being an admin!`, ephemeral: true });
            }
        });

export default command;