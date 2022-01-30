import { GuildMember } from 'discord.js';
import { createSubCommand } from '../../utilities.js';

const command = createSubCommand('kick', 'Kicks a member',
    builder => builder.addUserOption(option => option.setName('user')
        .setDescription('The member to be kicked off the server')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
            .setDescription('The reason of kicking him/her')
            .setRequired(false)),
    async interaction => {
        const targetMember = interaction.options.getMember('user', true) as GuildMember;

        if (targetMember.user.bot)
            await interaction.reply({ content: `${targetMember.displayName} is a bot, and bots can't be kicked!`, ephemeral: true });
        else {
            const reason = interaction.options.getString('reason', false);

            await targetMember.kick(reason === null ? undefined : reason);

            await interaction.reply({ content: `Oof, ${targetMember.displayName} has been kicked!`, ephemeral: false });
        }
    });

export default command;