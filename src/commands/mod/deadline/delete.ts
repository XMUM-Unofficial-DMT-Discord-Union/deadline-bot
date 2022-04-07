import { Message, ActionRowBuilder, SelectMenuBuilder, ComponentType, Colors } from 'discord.js';

import { Course, Deadline } from '@prisma/client';
import { createSubCommand, GUILD, resolveBaseCustomId } from '../../../utilities.js';

const GLOBAL_CUSTOMID = resolveBaseCustomId(import.meta.url);

function courseReplyOptions() {
    return {
        embeds: [{
            title: 'Choose a course'
        }],
        components: [new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents((() => {
                const menu = new SelectMenuBuilder()
                    .setCustomId(GLOBAL_CUSTOMID + ' course');

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
            })())]
    };
}

function deadlineReplyOptions(course: Course & { deadlines: Deadline[]; }) {
    return {
        embeds: [{
            title: 'Choose a deadline to delete.'
        }], components: [new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents((() => {
                const menu = new SelectMenuBuilder()
                    .setCustomId(GLOBAL_CUSTOMID + ' choose_deadline');

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
        if (interaction.isAutocomplete()) throw `Command \`add\` does not have AutoComplete logic`;

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
            componentType: ComponentType.SelectMenu,
            idle: 30000
        })
            .on('collect', async componentInteraction => {
                if (componentInteraction.customId === GLOBAL_CUSTOMID + ' course') {
                    const course = await GUILD.getCourse(componentInteraction.values[0], { deadlines: true });
                    response.course = await GUILD.getCourse(componentInteraction.values[0], { deadlines: true }) as unknown as Course;

                    await componentInteraction.update({
                        ...deadlineReplyOptions(response.course)
                    });
                }
                else if (componentInteraction.customId === GLOBAL_CUSTOMID + ' choose_deadline') {
                    collector.stop();

                    await GUILD.removeDeadlineFromCourse(response.course.name, componentInteraction.values[0]);

                    await componentInteraction.update({
                        embeds: [{
                            title: 'Deadline Removed!',
                            color: Colors.DarkGreen
                        }],
                        components: []
                    });
                }
            });
    },
    undefined,
    async componentInteraction => {

    });

export default command;