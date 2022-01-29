import { CommandInteraction, Message, MessageEmbedOptions } from 'discord.js';
import ms, { StringValue } from 'ms';
import { rescheduleReminders } from '../../scheduler.js';

import { createSubCommand, GUILD } from '../../utilities.js';

function editReminderEmbed(newRemind: number): MessageEmbedOptions {
    return {
        title: 'Deadline Reminder Settings',
        description: `Please enter a new remind time relative to any deadline.\n(Was \`${ms(newRemind)}\` before the deadline)`,
        fields: [{
            name: 'Input Format',
            value: `Human-readable, e.g. \`1 hour\`, \`1 month\`, \`65 days\``
        }]
    };
}
const command = createSubCommand('settings', 'Change how you want your deadlines to be reminded.',
    builder => builder,
    async interaction => {

        const student = GUILD.getStudent(interaction.user.id);

        if (student === undefined) {
            await interaction.reply({ content: 'Hmm, you\'re not saved in database. Please notify the developer about this issue.', ephemeral: true });
            return;
        }

        await interaction.reply({ embeds: [editReminderEmbed(student._remindTime)], ephemeral: true });

        const collector = interaction.channel?.createMessageCollector({
            filter: message => message.author.id === interaction.user.id,
            idle: 20000
        })
            .on('collect', async message => {
                if (message.content.length > 100 || ms(message.content as StringValue) === NaN) {
                    await interaction.followUp({ content: 'Invalid input, please try again.', ephemeral: true })
                    return;
                }

                student._remindTime = ms(message.content as StringValue);
                await message.delete();
                GUILD.modifyStudent(student);

                await GUILD.save();

                await interaction.editReply({
                    embeds: [{
                        title: 'Deadline Reminder Saved ✅',
                        color: 'GREEN'
                    }]
                });

                collector?.stop();
            });
    });

export default command;