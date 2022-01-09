import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "../types";

const command: ICommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.reply({ content: 'Pong! :ping_pong:', ephemeral: true });
    }
}

module.exports = command;