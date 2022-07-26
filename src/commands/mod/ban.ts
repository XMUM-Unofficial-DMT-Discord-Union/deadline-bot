import { GuildMember, InteractionType } from 'discord.js';
import { createSubCommand } from '../../utilities.js';

const command = createSubCommand('ban', 'Bans a member',
    builder => builder.addUserOption(option => option.setName('user')
        .setDescription('The user to be banned off the server')
        .setRequired(true))
        .addNumberOption(option => option.setName('days')
            .setDescription('The number of days to ban him/her (0 for indefinite)')
            .setRequired(true)
            .setMinValue(0))
        .addStringOption(option => option.setName('reason')
            .setDescription('The reason for banning him/her')
            .setRequired(false)),
    async interaction => {
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) throw `Command \`add\` does not have AutoComplete logic`;

        const targetMember = interaction.options.getMember('user') as GuildMember;

        if (targetMember.user.bot)
            await interaction.reply({ content: `${targetMember.displayName} is a bot, and bots can't be banned!`, ephemeral: true });
        else {
            const days = interaction.options.getNumber('days', true);
            const reason = interaction.options.getString('reason', false);
            await targetMember.ban({
                deleteMessageDays: days === 0 ? undefined : days,
                reason: reason === null ? undefined : reason
            });

            await interaction.reply({ content: `Oh no, ${targetMember.displayName} has been banned ${days === 0 ? 'FOREVER' : `for ${days} days`}!`, ephemeral: false });
        }
    });

export default command;