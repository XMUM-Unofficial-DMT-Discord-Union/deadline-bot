import { ChatInputCommandInteraction, Message, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, SelectMenuInteraction, ComponentType, ModalBuilder, TextInputStyle, ButtonStyle, ModalSubmitInteraction } from 'discord.js';
import { Course } from '@prisma/client';
import dayjs from 'dayjs';

import { createSubCommand, GUILD, messageComponentCloseCollector, resolveBaseCustomId } from '../../../utilities.js';
import { TextInputBuilder } from '@discordjs/builders';

const CUSTOMID = {
    name: 'name',
    date: 'date',
    description: 'description',
    url: 'url'
};

const ID_TO_COURSE: {
    [id: string]: Course;
} = {};

const GLOBAL_CUSTOMID = resolveBaseCustomId(import.meta.url);

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
    async (modal: ModalSubmitInteraction) => {

        let actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('no')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('yes')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
            );

        let date = modal.fields.getTextInputValue(CUSTOMID.date);
        let name = modal.fields.getTextInputValue(CUSTOMID.name);
        let description = modal.fields.getTextInputValue(CUSTOMID.description);
        let url = modal.fields.getTextInputValue(CUSTOMID.url);

        const parsed = dayjs(date, 'DD/MM/YYYY, HH:mm:ss', 'ms_MY', true);

        await modal.deferReply({ ephemeral: true });

        if (!parsed.isValid() || parsed.isBefore(dayjs())) {
            const message = await modal.followUp({
                content: 'Looks like you gave a wrong date. Do you want to try again? (Close this message after responding)',
                components: [actionRow],
                ephemeral: true,
                fetchReply: true
            }) as Message;

            try {
                const componentInteraction = await message.awaitMessageComponent({
                    componentType: ComponentType.Button,
                    filter: component => component.user.id === modal.user.id,
                });

                if (componentInteraction.id === 'no')
                    return;

                let newModal = new ModalBuilder()
                    .setCustomId(GLOBAL_CUSTOMID)
                    .setTitle('Add Deadline')
                    .addComponents(
                        new ActionRowBuilder<TextInputBuilder>()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId(CUSTOMID.name)
                                    .setLabel('Name')
                                    .setStyle(TextInputStyle.Short)
                                    .setValue(name)
                                    .setRequired(true),
                                new TextInputBuilder()
                                    .setCustomId(CUSTOMID.date)
                                    .setLabel('Date (In DD/MM/YYYY, HH:mm:ss)')
                                    .setPlaceholder('e.g. 31/01/2001, 13:05:00')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true),
                                new TextInputBuilder()
                                    .setCustomId(CUSTOMID.description)
                                    .setLabel('Description')
                                    .setValue(description)
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(false),
                                new TextInputBuilder()
                                    .setCustomId(CUSTOMID.url)
                                    .setLabel('URL Referring to this deadline')
                                    .setPlaceholder('e.g. https://l.xmu.edu.my/mod/assign/view.php?id=204150')
                                    .setValue(url)
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)));

                await componentInteraction.showModal(newModal);
            }
            catch (e) {
            }

            return;
        }

        await GUILD.addDeadlineToCourse(ID_TO_COURSE[modal.user.id].name, {
            name: name,
            datetime: parsed.toDate(),
            description: description,
            url: url
        }, modal.client);

        await modal.followUp({ content: `Deadline Added! :white_check_mark:`, ephemeral: true });
    },
    async componentInteraction => {
        if (componentInteraction.isSelectMenu()) {

            ID_TO_COURSE[componentInteraction.user.id] = await GUILD.getCourse(componentInteraction.values[0], undefined) as Course;

            let modal = new ModalBuilder()
                .setCustomId(GLOBAL_CUSTOMID)
                .setTitle('Add Deadline')
                .addComponents(
                    new ActionRowBuilder({
                        components: [
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.name)
                                .setLabel('Name')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true),
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.date)
                                .setLabel('Date (In DD/MM/YYYY, HH:mm:ss)')
                                .setPlaceholder('e.g. 31/01/2001, 13:05:00')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true),
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.description)
                                .setLabel('Description')
                                .setStyle(TextInputStyle.Paragraph)
                                .setValue('')
                                .setRequired(false),
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.url)
                                .setLabel('URL Referring to this deadline')
                                .setPlaceholder('e.g. https://l.xmu.edu.my/mod/assign/view.php?id=204150')
                                .setValue('')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)]
                    }));

            await componentInteraction.showModal(modal);
            return;
        }
    });

export default command;