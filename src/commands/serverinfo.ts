import { Permissions } from "../types.js";
import { createCommand } from "../utilities.js";

const command = createCommand('serverinfo', 'Replies with server info!', Permissions.VERIFIED, (_) => _, async (interaction) => {
    await interaction.reply({ content: `Server Name: ${interaction.guild?.name}\nTotal members: ${interaction.guild?.memberCount}`, ephemeral: true });
})

export default command;