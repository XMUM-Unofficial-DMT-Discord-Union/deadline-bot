import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Shows the uptime of this bot'),
    async execute(interaction: CommandInteraction<CacheType>) {
        const time = new Date(Date.UTC(0, 0, 0, 0, 0, 0, interaction.client.uptime as number));

        const parts = [time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds()];

        await interaction.reply({ content: `Bot uptime: ${parts.map(part => String(part).padStart(2, '0')).join(':')}`, ephemeral: true });
    }
}