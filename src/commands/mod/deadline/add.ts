import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, ModalBuilder, TextInputStyle, ButtonStyle, ModalSubmitInteraction, TextInputBuilder } from 'discord.js';
import { Course } from '@prisma/client';
import dayjs from 'dayjs';

import { createSubCommand, GUILD, messageComponentCloseCollector, resolveBaseCustomId } from '../../../utilities.js';

/**
 * As of 7th April 2022, there are no viable options to let users retry for modal resubmission
 */

const CUSTOMID = {
    name: 'name', date: 'date',
    description: 'description',
    url: 'url'
};

const ID_TO_COURSE: {
    [id: string]: Course;
} = {};

const ID_TO_DETAILS: {
    [id: string]: { name: string, date: string, description: string, url: string; };
} = {};

const GLOBAL_CUSTOMID = resolveBaseCustomId(import.meta.url);

const modal = new ModalBuilder()
    .setCustomId(GLOBAL_CUSTOMID)
    .setTitle('Add Deadline')
    .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId(CUSTOMID.name)
                    .setLabel('Name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId(CUSTOMID.date)
                    .setLabel('Date (In DD/MM/YYYY, HH:mm:ss)')
                    .setPlaceholder('e.g. 31/01/2001, 13:05:00')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId(CUSTOMID.description)
                    .setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)),
        new ActionRowBuilder<TextInputBuilder>()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId(CUSTOMID.url)
                    .setLabel('URL Referring to this deadline')
                    .setPlaceholder('e.g. https://l.xmu.edu.my/mod/assign/view.php?id=204150')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)));

async function courseReplyOptions() {
    return {
        embeds: [{
            title: 'Choose a course'
        }],
        components: [new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(await (async () => {
                const menu = new SelectMenuBuilder()
                    .setCustomId(GLOBAL_CUSTOMID);

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

async function chooseCourseLifecycle(interaction: ChatInputCommandInteraction) {
    try {
        const fields = await courseReplyOptions();
    }
    catch (error) {
        await interaction.reply({ content: `It seems like there aren't any courses...`, ephemeral: true });
        throw 'No deadlines';
    }
    // If the above does not throw an error, there's deadlines available to delete
    await interaction.reply({
        ...await courseReplyOptions(),
        ephemeral: true
    });

    await messageComponentCloseCollector(interaction);
}


const command = createSubCommand('add', 'Adds a deadline',
    builder => builder,
    async interaction => {
        if (interaction.isChatInputCommand())
            await chooseCourseLifecycle(interaction);
    },
    async (modalInteraction: ModalSubmitInteraction) => {

        let actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(GLOBAL_CUSTOMID + ' no')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(GLOBAL_CUSTOMID + ' yes')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
            );

        ID_TO_DETAILS[modalInteraction.user.id] = {
            date: modalInteraction.fields.getTextInputValue(CUSTOMID.date),
            name: modalInteraction.fields.getTextInputValue(CUSTOMID.name),
            description: modalInteraction.fields.getTextInputValue(CUSTOMID.description),
            url: modalInteraction.fields.getTextInputValue(CUSTOMID.url)
        };

        const parsed = dayjs(ID_TO_DETAILS[modalInteraction.user.id].date, 'DD/MM/YYYY, HH:mm:ss', 'ms_MY', true);

        if (!parsed.isValid() || parsed.isBefore(dayjs())) {
            await modalInteraction.reply({
                content: 'Looks like you gave a wrong date. Do you want to try again?',
                components: [actionRow],
                ephemeral: true,
            });

            await messageComponentCloseCollector(modalInteraction);
            return;
        }

        await GUILD.addDeadlineToCourse(ID_TO_COURSE[modalInteraction.user.id].name, {
            name: ID_TO_DETAILS[modalInteraction.user.id].name,
            datetime: parsed.toDate(),
            description: ID_TO_DETAILS[modalInteraction.user.id].description,
            url: ID_TO_DETAILS[modalInteraction.user.id].url
        }, modalInteraction.client);

        await modalInteraction.reply({ content: `Deadline Added! :white_check_mark:`, ephemeral: true });
    },
    async componentInteraction => {

        if (componentInteraction.isSelectMenu()) {

            ID_TO_COURSE[componentInteraction.user.id] = await GUILD.getCourse(componentInteraction.values[0], undefined) as Course;

            await componentInteraction.showModal(modal);
            return;
        }
        if (componentInteraction.isButton()) {

            if (componentInteraction.customId === GLOBAL_CUSTOMID + ' no')
                return;

            let newModal = new ModalBuilder(modal.toJSON())
                .setComponents(...modal.components.map(actionRow =>
                    new ActionRowBuilder<TextInputBuilder>(actionRow.toJSON())
                        .setComponents(...actionRow.components.map(component => {
                            if (component.data.custom_id === CUSTOMID.name)
                                component.setValue(ID_TO_DETAILS[componentInteraction.user.id].name);
                            if (component.data.custom_id === CUSTOMID.description)
                                component.setValue(ID_TO_DETAILS[componentInteraction.user.id].description);
                            if (component.data.custom_id === CUSTOMID.url)
                                component.setValue(ID_TO_DETAILS[componentInteraction.user.id].url);
                            return component;
                        }))
                ));

            await componentInteraction.showModal(newModal);
            return;
        }
    });

export default command;