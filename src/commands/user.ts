import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Replies with user info!'),
    async execute(interaction: CommandInteraction<CacheType>) {
        await interaction.reply(`Your tag: ${interaction.user.tag}\n Your id: ${interaction.user.id}`);
    }
}