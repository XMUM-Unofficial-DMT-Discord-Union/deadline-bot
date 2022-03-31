import { ModalSubmitInteraction } from 'discord-modals';
import { Client } from 'discord.js';

import Commands from '../commands.js';

export default {
    once: false,
    name: 'modalSubmit',
    async execute(interaction: ModalSubmitInteraction) {

        let categorySeparatorIndex = interaction.customId.indexOf(' ');
        let nextHandlerId = interaction.customId.substring(0, categorySeparatorIndex === -1 ? undefined : categorySeparatorIndex);
        let partitionId = categorySeparatorIndex === -1 ? interaction.customId : interaction.customId.substring(categorySeparatorIndex + 1);

        let handler = Commands.MODAL_HANDLERS.get(nextHandlerId);

        if (handler === undefined)
            throw `The modal with id '${interaction.customId}' does not have an appropriate handler.`;
        else
            await handler(interaction, partitionId);
    }
};