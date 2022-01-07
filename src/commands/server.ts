import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Replies with server info!'),
    async execute(interaction: CommandInteraction<CacheType>) {
        await interaction.reply(`Server Name: ${interaction.guild?.name}\nTotal members: ${interaction.guild?.memberCount}`);
    }
}