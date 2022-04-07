import { Permissions } from "../types.js";
import { createCommand } from "../utilities.js";

const command = createCommand('ping', 'Replies with Pong!', Permissions.VERIFIED, (_) => _, async (interaction) => {
    if (interaction.isAutocomplete()) throw `Command \`add\` does not have AutoComplete logic`;

    await interaction.reply({ content: 'Pong! :ping_pong:', ephemeral: true });
});

export default command;