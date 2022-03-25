/**
 * TODO: Refactor progressive callbacks as one utility for ease of state management
 */

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu, TextBasedChannel } from 'discord.js';

import { Course, Deadline, Student } from '@prisma/client';
import { createSubCommand, GUILD } from '../../../utilities.js';

type Response = {
    name: string,
    datetime: Date,
    description: string,
    url: string,
    excluded: Array<string>;
};

type CallbackReturn = [Response, boolean];

const yesButton = new MessageButton()
    .setCustomId('yes')
    .setLabel('Yes')
    .setStyle('PRIMARY');

const noButton = new MessageButton()
    .setCustomId('no')
    .setLabel('no')
    .setStyle('PRIMARY');

const skipButton = new MessageButton()
    .setCustomId('skip')
    .setLabel('skip')
    .setStyle('SECONDARY');

const callbacks = [
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, deadline: Deadline): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.name = message.content;
            await message.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Edit Deadline',
                description: `Please enter the deadline name.\n(Was \`${deadline.name}\`)`
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, deadline: Deadline): Promise<CallbackReturn> => {
        let hasMessage = message !== undefined;
        if (hasMessage) {
            response.name = message?.content as string;
            await message?.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Edit Deadline',
                description: `Please enter the deadline date of this deadline.\n(Was \`${deadline.datetime.toLocaleString()}\`)`,
                color: hasMessage ? 'DEFAULT' : 'RED',
                fields: [{
                    name: 'Format',
                    value: `\`DD/MM/YYYY, HH:mm:ss\``
                }]
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, deadline: Deadline): Promise<CallbackReturn> => {
        if (message !== undefined) {
            dayjs.extend(customParseFormat);
            const parsed = dayjs(message.content, 'DD/MM/YYYY, HH:mm:ss', 'ms_MY', true);
            await message.delete();

            if (!parsed.isValid() || parsed.isBefore(dayjs()))
                return [response, false];

            response.datetime = parsed.toDate();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Edit Deadline',
                description: `Please enter the description of this deadline.\n(Was \`${deadline.description || ' '}\`)`
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, deadline: Deadline): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.description = message.content;
            await message.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Edit Deadline',
                description: `Please enter the url referring to this deadline on Moodle.\n(Was \`${deadline.url || ' '}\`)`
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, deadline: Deadline): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.url = message.content;
            await message.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Is this correct? (Respond with yes/no)',
                fields: [
                    {
                        name: 'Name',
                        value: response.name || '\`None\`'
                    },
                    {
                        name: 'Time',
                        value: response.datetime.toLocaleString()
                    },
                    {
                        name: 'Description',
                        value: response.description || '\`None\`'
                    },
                    {
                        name: 'url',
                        value: response.url || '\`None\`'
                    }
                ]
            }],
            components: [new MessageActionRow()
                .addComponents([yesButton, noButton])]
        });

        return [response, true];

    }];

async function courseReplyOptions() {
    return {
        embeds: [{
            title: 'Choose a course'
        }],
        components: [new MessageActionRow()
            .addComponents(await (async () => {
                const menu = new MessageSelectMenu()
                    .setCustomId('course');

                let hasValues = false;
                for (let course of await GUILD.getAllCourses()) {
                    if (course.deadline.length === 0)
                        continue;

                    hasValues = true;

                    menu.addOptions({
                        label: course.name,
                        value: course.name
                    });
                }

                if (!hasValues)
                    throw 'No deadlines.';

                return menu;
            })())]
    };
}

function deadlineReplyOptions(course: Course & { deadline: Deadline[]; }) {
    return {
        embeds: [{
            title: 'Choose a deadline to edit.'
        }], components: [new MessageActionRow()
            .addComponents((() => {
                const menu = new MessageSelectMenu()
                    .setCustomId('choose_deadline');

                for (let deadline of course.deadline) {
                    menu.addOptions({
                        label: deadline.name,
                        value: deadline.name
                    });
                }

                return menu;
            })())]
    };
}

async function chooseDeadlineLifecycle(interaction: CommandInteraction) {
    let response: {
        course: Course & { deadline: Deadline[]; };
        deadline: Deadline;
    };

    try {
        const fields = await courseReplyOptions();
    }
    catch (error) {
        await interaction.reply({ content: `It seems like there aren't any deadlines...`, ephemeral: true });
        return Promise.reject('No deadlines');
    }
    // If the above does not throw an error, there's deadlines available to delete

    const reply = await interaction.reply({
        ...await courseReplyOptions(),
        fetchReply: true, ephemeral: true
    }) as Message;

    const collector = reply.createMessageComponentCollector({
        filter: component => component.user.id === interaction.user.id,
        componentType: 'SELECT_MENU',
        idle: 30000
    })
        .on('collect', async componentInteraction => {
            if (componentInteraction.customId === 'course') {
                const course = (await GUILD.getCourse(componentInteraction.values[0]));

                if (course === undefined) {
                    collector.stop();
                    await interaction.editReply({ content: 'Looks like someone tampered with this course while you\'re choosing. Please try again.' });
                    await componentInteraction.update({ embeds: [], components: [] });
                    throw 'Weird race condition in /mod deadline edit `chooseDeadlineLifecycle`';
                }
                response.course = course;

                await componentInteraction.update({
                    ...deadlineReplyOptions(course)
                });
            }
            else if (componentInteraction.customId === 'choose_deadline') {
                response.deadline = response.course.deadline.find(deadline => deadline.name === componentInteraction.values[0]);

                await componentInteraction.update({
                    components: [new MessageActionRow()
                        .addComponents(skipButton)]
                });
                collector.stop();
            }
        })
        .on('end', async () => {
            await editDeadlineLifecycle(interaction, reply, response.course.name, response.deadline);
        });
}

async function editDeadlineLifecycle(interaction: CommandInteraction, message: Message, courseName: string, deadline: Deadline & { excludedStudents: Student[]; }) {
    let id = 0;
    let response: typeof deadline = {
        name: deadline.name,
        datetime: deadline.datetime,
        description: deadline.description,
        url: deadline.url,
        excludedStudents: deadline.excludedStudents,

    };
    let isSuccess = true;

    await interaction.editReply({
        embeds: [{
            title: 'Please enter the deadline name.',
            description: `(Was \`${deadline.name}\`)`
        }]
    });

    id++;

    const collector = new MessageCollector(interaction.channel as TextBasedChannel, {
        filter: message => message.author.id === interaction.user.id,
        idle: 30000
    })
        .on('collect', async message => {
            [response, isSuccess] = await callbacks[id++](interaction, message, response, deadline);

            if (!isSuccess) {
                id -= 1;
                await interaction.followUp({ content: `Invalid response.`, ephemeral: true });
            }
        });

    const componentCollector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        filter: interactor => interactor.user.id === interaction.user.id,
        idle: 30000
    })
        .on('collect', async componentInteraction => {

            if (componentInteraction.customId !== 'skip') {
                // We're in the last comfirmation
                if (componentInteraction.customId === 'no') {
                    id = 0;

                    await componentInteraction.update({
                        components: [new MessageActionRow()
                            .addComponents(skipButton)]
                    });

                    [response, isSuccess] = await callbacks[id++](interaction, undefined, response, deadline);
                }
                else {
                    componentCollector.stop();
                    collector.stop();
                    await componentInteraction.update({ components: [] });

                    await GUILD.editDeadlineFromCourse(courseName.name, deadline, response);

                    await interaction.editReply({
                        embeds: [{
                            title: 'Edit Deadline ✅',
                            color: 'GREEN'
                        }]
                    });
                }

                return;
            }

            if (id === 1)
                response.name = deadline.name;
            else if (id === 2)
                response.datetime = deadline.datetime;
            else if (id === 3)
                response.description = deadline.description;
            else if (id === 4)
                response.url = deadline.url;

            await componentInteraction.update({
                components: [new MessageActionRow()
                    .addComponents(skipButton)]
            });

            [response, isSuccess] = await callbacks[id++](interaction, undefined, response, deadline);

            if (!isSuccess) {
                id -= 1;
                await interaction.followUp({ content: `Invalid response.`, ephemeral: true });
            }
        })
        .on('stop', async () => {

            const disabled = message.components[0].components;
            disabled.forEach(component => component.setDisabled(true));
            await interaction.editReply({
                components: [new MessageActionRow()
                    .setComponents(disabled)]
            });
        });
}

const command = createSubCommand('edit', 'Edits an existing deadline',
    builder => builder,
    async interaction => {
        await chooseDeadlineLifecycle(interaction)
            .catch(error => console.log(error));
    });

export default command;