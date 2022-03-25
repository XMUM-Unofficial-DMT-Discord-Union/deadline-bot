import { Message, MessageActionRow, MessageSelectMenu } from 'discord.js';

import { Course } from '../../../models/course.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

function courseReplyOptions() {
    return {
        embeds: [{
            title: 'Choose a course'
        }],
        components: [new MessageActionRow()
            .addComponents([(() => {
                const menu = new MessageSelectMenu()
                    .setCustomId('course');

                let hasValue = false;
                for (let course of Object.values(GUILD.getAllCourses())) {
                    if (course.deadlines.length === 0)
                        continue;

                    hasValue = true;
                    menu.addOptions({
                        label: course.name,
                        value: course.name
                    });
                }

                if (!hasValue)
                    throw 'No deadlines.';

                return menu;
            })()])]
    };
}

function deadlineReplyOptions(course: Course) {
    return {
        embeds: [{
            title: 'Choose a deadline to delete.'
        }], components: [new MessageActionRow()
            .addComponents((() => {
                const menu = new MessageSelectMenu()
                    .setCustomId('choose_deadline');

                for (let deadline of course.deadlines) {
                    menu.addOptions({
                        label: deadline.name,
                        value: deadline.name
                    });
                }

                return menu;
            })())]
    };
}

const command = createSubCommand('delete', 'Deletes a deadline',
    builder => builder,
    async interaction => {
        const response: any = {};


        try {
            const fields = courseReplyOptions();
        }
        catch (error) {
            await interaction.reply({ content: `It seems like there aren't any deadlines...`, ephemeral: true });
            return;
        }
        // If the above does not throw an error, there's deadlines available to delete

        const reply = await interaction.reply({
            ...courseReplyOptions(),
            fetchReply: true, ephemeral: true
        }) as Message;


        const collector = reply.createMessageComponentCollector({
            filter: component => component.user.id === interaction.user.id,
            componentType: 'SELECT_MENU',
            idle: 30000
        })
            .on('collect', async componentInteraction => {
                if (componentInteraction.customId === 'course') {
                    response.course = await GUILD.getCourse(componentInteraction.values[0]) as unknown as Course;

                    await componentInteraction.update({
                        ...deadlineReplyOptions(response.course)
                    });
                }
                else if (componentInteraction.customId === 'choose_deadline') {
                    collector.stop();

                    await GUILD.removeDeadlineFromCourse(response.course.name, componentInteraction.values[0]);

                    await componentInteraction.update({
                        embeds: [{
                            title: 'Deadline Removed!',
                            color: 'DARK_GREEN'
                        }],
                        components: []
                    });
                }
            });
    });

export default command;