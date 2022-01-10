import { createCommand } from "../utilities";

const command = createCommand('ping', 'Replies with Pong!', (_) => _, async (interaction) => {
    await interaction.reply({ content: 'Pong! :ping_pong:', ephemeral: true });
});

module.exports = command;