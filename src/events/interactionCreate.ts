import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, Interaction, ModalSubmitInteraction } from "discord.js";

import Commands from "../commands.js";

export default {
    once: false,
    name: 'interactionCreate',
    async execute(interaction: Interaction<CacheType>) {

        // TODO: Add Support for Context Menus
        if (interaction.isContextMenuCommand() || interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) return;

        // Modal-specific interaction
        if (interaction.isModalSubmit() || interaction.isMessageComponent()) {
            let categorySeparatorIndex = interaction.customId.indexOf(' ');
            let nextHandlerId = interaction.customId.substring(0, categorySeparatorIndex === -1 ? undefined : categorySeparatorIndex);
            let partitionId = categorySeparatorIndex === -1 ? interaction.customId : interaction.customId.substring(categorySeparatorIndex + 1);

            let handler = Commands.MODAL_HANDLERS.get(nextHandlerId);

            if (handler === undefined) {
                await interaction.reply({ content: `Oops! Looks like the bot encountered a bug. Please report this to the developer.`, ephemeral: true });
                throw `The modal with id '${interaction.customId}' does not have an appropriate handler.`;
            }
            else
                await handler(interaction, partitionId);
            return;
        }

        if (!(interaction.isChatInputCommand() || interaction.isAutocomplete())) return;


        const command = Commands.BOT_COMMANDS.get(interaction.commandName);

        // TODO: Add Error Response
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            await (interaction as ChatInputCommandInteraction).reply({ content: `Oops! Looks like the bot encountered a bug. Please report this to the developer.`, ephemeral: true });
            throw error;
        }
    }
};