import { Permissions } from "../types.js";
import { createCommand } from "../utilities.js";

const command = createCommand('bonk', 'BONK someone!', Permissions.EVERYONE, (_) => _, async (interaction) => {
    await interaction.reply({
        files: [
            {
                name: 'bonk.png',
                attachment: 'https://i1.wp.com/tubeindian.in/wp-content/uploads/BONK-MEME.jpg?resize=780%2C470&ssl=1'
            }
        ]
    });
})

export default command;