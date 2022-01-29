import { GuildMember } from 'discord.js';
import { createSubCommand } from '../../utilities.js';

const command = createSubCommand('warn', 'Warns a member',
    builder => builder.addUserOption(option => option.setName('user')
        .setDescription('The user to be warned.')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
            .setDescription('The reason for warning him/her')
            .setRequired(true)),
    async interaction => {

        if (process.env.ENVIRONMENT === 'production') {
            const targetMember = interaction.options.getMember('user', true) as GuildMember;
            const channel = interaction.guild?.channels.resolve('923137246914310154');

            await interaction.deferReply({ ephemeral: true });

            if (targetMember.user.bot)
                await interaction.reply({ content: `${targetMember.displayName} is a bot, and bots can't be warned!`, ephemeral: true });
            else {
                const reason = interaction.options.getString('reason', true);

                if (channel?.isText()) {
                    await channel?.send({
                        content: `Oh no, ${targetMember}. You've been warned for *${reason}*`,
                        files: ['https://i.imgur.com/iIwe4Zv.png']
                    });
                }

                await interaction.followUp({ content: `Warning sent!`, ephemeral: true })
            }
        } else {
            const targetMember = interaction.options.getMember('user', true) as GuildMember;
            const channel = interaction.guild?.channels.resolve('936951506551308288');

            if (targetMember.user.bot)
                await interaction.reply({ content: `${targetMember.displayName} is a bot, and bots can't be warned!`, ephemeral: true });
            else {
                const reason = interaction.options.getString('reason', true);

                await interaction.deferReply({ ephemeral: true });

                if (channel?.isText()) {
                    await channel?.send({
                        content: `Oh no, ${targetMember}. You've been warned for *${reason}*`,
                        files: ['https://i.imgur.com/iIwe4Zv.png']
                    });
                }

                await interaction.followUp({ content: `Warning sent!`, ephemeral: true })
            }
        }
    });

export default command;