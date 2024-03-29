import { Colors, InteractionType } from 'discord.js';
import ms, { StringValue } from 'ms';

import { createSubCommand, prisma } from '../../utilities.js';

const command = createSubCommand('settings', 'Change how you want your deadlines to be reminded.',
    builder => builder,
    async interaction => {
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) throw `Command \`add\` does not have AutoComplete logic`;


        const student = await prisma.student.findUnique({
            where: {
                discordId: interaction.user.id
            },
        });

        if (student === null) {
            await interaction.reply({ content: 'Hmm, you\'re not saved in database. Please notify the developer about this issue.', ephemeral: true });
            return;
        }

        await interaction.reply({
            embeds: [{
                title: 'Deadline Reminder Settings',
                description: `Please enter a new remind time relative to any deadline.\n(Was \`${student.remindTime}\` before the deadline)`,
                fields: [{
                    name: 'Input Format',
                    value: `Human-readable, e.g. \`1 hour\`, \`1 month\`, \`65 days\``
                }]
            }], ephemeral: true
        });

        const collector = interaction.channel?.createMessageCollector({
            filter: message => message.author.id === interaction.user.id,
            idle: 20000
        })
            .on('collect', async message => {
                if (message.content.length > 100 || ms(message.content as StringValue) === NaN) {
                    await interaction.followUp({ content: 'Invalid input, please try again.', ephemeral: true });
                    return;
                }

                await prisma.student.update({
                    where: {
                        discordId: student.discordId
                    },
                    data: {
                        remindTime: message.content as StringValue
                    }
                });

                await message.delete();

                await interaction.editReply({
                    embeds: [{
                        title: 'Deadline Reminder Saved ✅',
                        color: Colors.Green
                    }]
                });

                collector?.stop();
            });
    });

export default command;