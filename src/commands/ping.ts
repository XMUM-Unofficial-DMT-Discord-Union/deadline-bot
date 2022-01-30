import { Permissions } from "../types.js";
import { createCommand } from "../utilities.js";

const command = createCommand('ping', 'Replies with Pong!', Permissions.VERIFIED, (_) => _, async (interaction) => {
    await interaction.reply({ content: 'Pong! :ping_pong:', ephemeral: true });
});

export default command;