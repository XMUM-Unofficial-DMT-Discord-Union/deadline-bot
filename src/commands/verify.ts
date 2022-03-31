import { Modal, showModal, TextInputComponent, ModalSubmitInteraction } from 'discord-modals';

import { Permissions } from '../types.js';
import { createCommand, GUILD } from '../utilities.js';

const CUSTOMID = {
    name: 'name',
    id: 'student_id',
    batch: 'student_batch'
};

const command = createCommand('verify', 'Helps us to validate that you are an XMUM Student!', Permissions.NOTVERIFIED,
    builder => builder,
    async interaction => {
        const modal = new Modal()
            .setCustomId('verify')
            .setTitle('Verification Form')
            .addComponents(
                new TextInputComponent()
                    .setCustomId(CUSTOMID.name)
                    .setRequired(true)
                    .setLabel('Full Student Name')
                    .setPlaceholder('Your name here')
                    .setStyle('SHORT'),
                new TextInputComponent()
                    .setCustomId(CUSTOMID.id)
                    .setRequired(true)
                    .setLabel('Student ID')
                    .setPlaceholder('Example: DMT1234123')
                    .setStyle('SHORT'),
                new TextInputComponent()
                    .setCustomId(CUSTOMID.batch)
                    .setRequired(true)
                    .setLabel('Batch Number')
                    .setPlaceholder('Example: 2002')
                    .setStyle('SHORT'));

        await showModal(modal, {
            client: interaction.client,
            interaction: interaction
        });
    },
    async (modal: ModalSubmitInteraction) => {

        const name = modal.getTextInputValue(CUSTOMID.name);
        const id = modal.getTextInputValue(CUSTOMID.id);
        const batch = modal.getTextInputValue(CUSTOMID.batch);

        await GUILD.addUnverifiedStudent({
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