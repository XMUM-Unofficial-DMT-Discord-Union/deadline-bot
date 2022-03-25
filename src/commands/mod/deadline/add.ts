import { Course } from '@prisma/client';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu, TextBasedChannel } from 'discord.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

const ID_STATES: {
    [discordId: string]: number;
} = {};

type Response = {
    name: string,
    datetime: Date,
    description: string,
    url: string,
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
    async (interaction: CommandInteraction, message: Message | undefined, response: Response): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.name = message.content;
            await message.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Add Deadline',
                description: `Please enter the deadline name.`
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response): Promise<CallbackReturn> => {
        let hasMessage = message !== undefined;
        if (hasMessage) {
            response.name = message?.content as string;
            await message?.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Add Deadline',
                description: `Please enter the deadline date of this deadline.`,
                color: hasMessage ? 'DEFAULT' : 'RED',
                fields: [{
                    name: 'Format',
                    value: `\`DD/MM/YYYY, HH:mm:ss\``
                }]
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response): Promise<CallbackReturn> => {
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
                title: 'Add Deadline',
                description: `Please enter the description of this deadline.`
            }],
            components: [new MessageActionRow()
                .addComponents(skipButton)]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.description = message.content;
            await message.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Add Deadline',
                description: `Please enter the url referring to this deadline on Moodle.`
            }],
            components: [new MessageActionRow()
                .addComponents(skipButton)]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response): Promise<CallbackReturn> => {
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

                if ((await GUILD.getAllCourses()).length === 0)
                    throw 'No courses.';

                for (let course of (await GUILD.getAllCourses())) {
                    menu.addOptions({
                        label: course.name,
                        value: course.name
                    });
                }

                return menu;
            })())]
    };
}

async function chooseCourseLifecycle(interaction: CommandInteraction) {
    const response: any = {};

    try {
        const fields = await courseReplyOptions();
    }
    catch (error) {
        await interaction.reply({ content: `It seems like there aren't any courses...`, ephemeral: true });
        throw 'No deadlines';
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
            response.course = await GUILD.getCourse(componentInteraction.values[0]) as unknown as Course;

            await componentInteraction.update({ components: [] });
            collector.stop();
        })
        .on('end', async () => {
            await addDeadlineLifecycle(interaction, reply, response.course);
        });
}

async function addDeadlineLifecycle(interaction: CommandInteraction, message: Message, course: Course) {
    ID_STATES[interaction.user.id] = 0;
    let response = {
        name: '',
        datetime: new Date(),
        description: '',
        url: '',
    };
    let isSuccess = true;

    await interaction.editReply({
        embeds: [{
            title: 'Add Deadline',
            description: `Please enter the deadline name.`
        }]
    });

    ID_STATES[interaction.user.id]++;

    const collector = new MessageCollector(interaction.channel as TextBasedChannel, {
        filter: message => message.author.id === interaction.user.id,
        idle: 30000
    })
        .on('collect', async message => {
            [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, message, response);

            if (!isSuccess) {
                ID_STATES[interaction.user.id] -= 1;
                await interaction.followUp({ content: `Invalid response.`, ephemeral: true });
            }
        });

    const componentCollector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        filter: interactor => interactor.user.id === interaction.user.id,
        idle: 50000
    })
        .on('collect', async componentInteraction => {

            if (componentInteraction.customId !== 'skip') {
                // We're in the last comfirmation
                if (componentInteraction.customId === 'no') {
                    ID_STATES[interaction.user.id] = 0;

                    await componentInteraction.update({
                        components: []
                    });
                    [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, undefined, response);
                }
                else {
                    componentCollector.stop();
                    collector.stop();
                    await componentInteraction.update({ components: [] });

                    await GUILD.addDeadlineToCourse(course.name, response, interaction.client);

                    await interaction.editReply({
                        embeds: [{
                            title: 'Add Deadline ✅',
                            color: 'GREEN'
                        }]
                    });
                }

                return;
            }

            await componentInteraction.update({});

            [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, undefined, response);

            if (!isSuccess) {
                ID_STATES[interaction.user.id] -= 1;
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

const command = createSubCommand('add', 'Adds a deadline',
    builder => builder,
    async interaction => {
        await chooseCourseLifecycle(interaction);
    });

export default command;