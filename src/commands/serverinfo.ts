import { createCommand } from "../utilities";

const command = createCommand('serverinfo', 'Replies with server info!', (_) => _, async (interaction) => {
    await interaction.reply({ content: `Server Name: ${interaction.guild?.name}\nTotal members: ${interaction.guild?.memberCount}`, ephemeral: true });
})

module.exports = command;