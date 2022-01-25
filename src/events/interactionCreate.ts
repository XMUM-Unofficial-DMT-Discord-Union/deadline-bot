import { CacheType, CommandInteraction, Interaction } from "discord.js";

import BOT_COMMANDS from "../commands.js";

export default {
    once: false,
    name: 'interactionCreate',
    async execute(interaction: Interaction<CacheType>) {
        // TODO: Add Error Response
        if (!(interaction.isCommand() || interaction.isAutocomplete())) return;

        const command = BOT_COMMANDS.get(interaction.commandName);

        // TODO: Add Error Response
        if (!command) return;


        try {
            await command.execute(interaction as CommandInteraction);
        } catch (error) {
            // TODO: Add Error Response
            console.error(error);

            await (interaction as CommandInteraction).reply({ content: `There was an error while executing this command!`, ephemeral: true });
        }
    }
}