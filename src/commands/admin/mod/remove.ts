import { Role } from "@prisma/client";
import { GuildMember } from "discord.js";

import { createSubCommand, GUILD } from "../../../utilities.js";

const command = createSubCommand('remove', 'Removes a moderator',
    (builder) => builder.addUserOption(option => option.setName('target_user')
        .setDescription('The user to remove from being a mod')
        .setRequired(true)), async interaction => {
            const targetMember = interaction.options.getMember('target_user', true) as GuildMember;

            const modId = (await GUILD.getModRole(interaction.guildId as string, interaction.client)).id;

            // If the member is not a mod
            if (targetMember.roles.resolve(modId) === null)
                await interaction.reply({ content: `${targetMember.displayName} was not a mod!`, ephemeral: true });
            else {
                await targetMember.roles.remove(modId);

                await GUILD.removeRoleFromStudent('MOD', interaction.user.id, interaction.guildId as string);

                await interaction.reply({ content: `${targetMember.displayName} has been removed from being a mod!`, ephemeral: true });
            }
        });

export default command;