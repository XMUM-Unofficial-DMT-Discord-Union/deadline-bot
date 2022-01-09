import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from '../types';

const command: ICommand = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Replies with server info!'),
    async execute(interaction) {
        await interaction.reply({ content: `Server Name: ${interaction.guild?.name}\nTotal members: ${interaction.guild?.memberCount}`, ephemeral: true });
    }
}

module.exports = command;