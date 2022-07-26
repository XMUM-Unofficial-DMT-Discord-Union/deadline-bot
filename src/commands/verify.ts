import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Permissions } from '../types.js';
import { createCommand, GUILD, resolveBaseCustomId } from '../utilities.js';

const CUSTOMID = {
    name: 'name',
    id: 'student_id',
    batch: 'student_batch'
};

const GLOBAL_CUSTOMID = resolveBaseCustomId(import.meta.url);

const command = createCommand('verify', 'Helps us to validate that you are an XMUM Student!', Permissions.NOTVERIFIED,
    builder => builder,
    async interaction => {
        if (interaction.isChatInputCommand()) {
            const modal = new ModalBuilder()
                .setCustomId(GLOBAL_CUSTOMID)
                .setTitle('Verification Form')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.name)
                                .setRequired(true)
                                .setLabel('Full Student Name')
                                .setPlaceholder('Your name here')
                                .setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.id)
                                .setRequired(true)
                                .setLabel('Student ID')
                                .setPlaceholder('Example: DMT1234123')
                                .setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId(CUSTOMID.batch)
                                .setRequired(true)
                                .setLabel('Batch Number')
                                .setPlaceholder('Example: 2002')
                                .setStyle(TextInputStyle.Short))
                );

            await interaction.showModal(modal);
        }
    },
    async (modal) => {

        const name = modal.fields.getTextInputValue(CUSTOMID.name);
        const id = modal.fields.getTextInputValue(CUSTOMID.id);
        const batch = modal.fields.getTextInputValue(CUSTOMID.batch);

        await GUILD.addUnverifiedStudent(modal.client, {
            name: name,
            id: id,
            enrolledBatch: batch,
            discordId: modal.user.id,
            guildId: modal.guildId as string
        });

        await modal.deferReply({ ephemeral: true });
        await modal.followUp({
            embeds: [{
                title: 'Success!',
                description: 'You can now clear this message.'
            }],
            ephemeral: true
        });
    });

export default command;