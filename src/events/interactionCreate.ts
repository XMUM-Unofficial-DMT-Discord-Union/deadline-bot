import { CacheType, Interaction } from "discord.js";
import BOT_COMMANDS from "../command_utilities";

module.exports = {
    once: false,
    name: 'interactionCreate',
    async execute(interaction: Interaction<CacheType>) {
        // TODO: Add Error Response
        if (!interaction.isCommand()) return;

        const command = BOT_COMMANDS.get(interaction.commandName);

        // TODO: Add Error Response
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            // TODO: Add Error Response
            console.error(error);

            await interaction.reply({ content: `There was an error while executing this command!`, ephemeral: true });
        }
    }
}