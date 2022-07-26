import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import { ChatInputCommandInteraction, Message, ActionRowBuilder, ButtonBuilder, MessageCollector, SelectMenuBuilder, TextBasedChannel, ButtonStyle, ComponentType, Colors, ButtonComponent, InteractionType } from 'discord.js';
import { Course, Deadline } from '../../../models/course.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

type Response = {
    name: string,
    datetime: Date,
    description: string,
    url: string,
    excluded: Array<string>;
};

type CallbackReturn = [Response, boolean];

const yesButton = new ButtonBuilder()
    .setCustomId('yes')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Primary);

const noButton = new ButtonBuilder()
    .setCustomId('no')
    .setLabel('no')
    .setStyle(ButtonStyle.Primary);

const ID_STATES: {
    [discordId: string]: number;
} = {};

const callbacks = [
    async (interaction: ChatInputCommandInteraction, message: Message | undefined, response: Response, deadline: Deadline, course: Course, isSuccess: boolean, collector: any): Promise<CallbackReturn> => {
        await interaction.editReply({
            embeds: [{
                title: 'Edit Deadline',
                description: `Please enter the deadline date of this deadline.\n(Was \`${deadline.datetime.toLocaleString()}\`)`,
                fields: [{
                    name: 'Format',
                    value: `\`DD/MM/YYYY, HH:mm:ss\``
                }]
            }],
            components: []
        });

        return [response, true];
    },
    async (interaction: ChatInputCommandInteraction, message: Message | undefined, response: Response, deadline: Deadline, course: Course, isSuccess: boolean, collector: any): Promise<CallbackReturn> => {
        if (message !== undefined) {
            dayjs.extend(customParseFormat);
            const parsed = dayjs(message.content, 'DD/MM/YYYY, HH:mm:ss', 'ms_MY', true);
            await message.delete();

            if (!parsed.isValid() || parsed.isBefore(dayjs()))
                return [response, false];

            response.datetime = parsed.toDate();
        }

        const reply = await interaction.editReply({
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
            components: [new ActionRowBuilder<ButtonBuilder>()
                .addComponents(yesButton, noButton)]
        }) as Message;

        const componentCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: interactor => interactor.user.id === interaction.user.id,
            idle: 30000
        })
            .on('collect', async componentInteraction => {
                if (componentInteraction.customId === 'no') {
                    ID_STATES[interaction.user.id] = 0;

                    [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, undefined, response, deadline, course, isSuccess, collector);
                }
                else {
                    componentCollector.stop();
                    collector.stop();
                    await componentInteraction.update({ components: [] });

                    await GUILD.editDeadlineFromCourse(course.name, deadline, response);

                    await interaction.editReply({
                        embeds: [{
                            title: 'Edit Deadline ✅',
                            color: Colors.Green
                        }]
                    });
                }
            })
            .on('stop', async () => {

                const disabled = reply.components[0].components.map(component => {
                    return ButtonBuilder.from(component as ButtonComponent).setDisabled(true);
                });

                await interaction.editReply({
                    components: [new ActionRowBuilder<ButtonBuilder>()
                        .setComponents(...disabled)]
                });
            });

        return [response, true];

    }];

function courseReplyOptions() {
    return {
        embeds: [{
            title: 'Choose a course'
        }],
        components: [new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents((() => {
                const menu = new SelectMenuBuilder()
                    .setCustomId('course');

                let hasValues = false;
                for (let course of Object.values(GUILD.getAllCourses())) {
                    if (course.deadlines.length === 0)
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

function deadlineReplyOptions(course: Course) {
    return {
        embeds: [{
            title: 'Choose a deadline to edit.'
        }], components: [new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents((() => {
                const menu = new SelectMenuBuilder()
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

async function chooseDeadlineLifecycle(interaction: ChatInputCommandInteraction) {
    const response: any = {};

    try {
        const fields = courseReplyOptions();
    }
    catch (error) {
        await interaction.reply({ content: `It seems like there aren't any deadlines...`, ephemeral: true });
        throw 'No deadlines';
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
            if (componentInteraction.customId === 'course') {
                response.course = await GUILD.getCourse(componentInteraction.values[0], undefined);

                await componentInteraction.update({
                    ...deadlineReplyOptions(response.course)
                });
            }
            else if (componentInteraction.customId === 'choose_deadline') {
                response.deadline = response.course.deadlines.find((deadline: any) => deadline.name === componentInteraction.values[0]);

                componentInteraction.update({ components: [] });

                collector.stop();
            }
        })
        .on('end', async () => {
            await extendDeadlineLifecycle(interaction, reply, response.course, response.deadline);
        });
}

async function extendDeadlineLifecycle(interaction: ChatInputCommandInteraction, message: Message, course: Course, deadline: Deadline) {
    ID_STATES[interaction.user.id] = 0;
    let response = {
        name: deadline.name,
        datetime: new Date(),
        description: deadline.description,
        url: deadline.url,
        excluded: deadline.excluded
    };
    let isSuccess = true;

    await interaction.editReply({
        embeds: [{
            title: 'Edit Deadline',
            description: `Please enter the deadline date of this deadline.\n(Was \`${deadline.datetime.toLocaleString()}\`)`,
            fields: [{
                name: 'Format',
                value: `\`DD/MM/YYYY, HH:mm:ss\``
            }]
        }]
    });

    ID_STATES[interaction.user.id]++;

    const collector = new MessageCollector(interaction.channel as TextBasedChannel, {
        filter: message => message.author.id === interaction.user.id,
        idle: 30000
    })
        .on('collect', async message => {
            [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, message, response, deadline, course, isSuccess, collector);

            if (!isSuccess) {
                ID_STATES[interaction.user.id] -= 1;
                await interaction.followUp({ content: `Invalid response.`, ephemeral: true });
            }
        });

}

const command = createSubCommand('extend', 'Extends an existing deadline',
    builder => builder,
    async interaction => {
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) throw `Command \`add\` does not have AutoComplete logic`;

        await chooseDeadlineLifecycle(interaction);
    });

export default command;