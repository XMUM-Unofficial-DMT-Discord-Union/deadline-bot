import { createCommand } from "../utilities";

const command = createCommand('bonk', 'BONK someone!', (_) => _, async (interaction) => {
    await interaction.reply({
        files: [
            {
                name: 'bonk.png',
                attachment: 'https://i1.wp.com/tubeindian.in/wp-content/uploads/BONK-MEME.jpg?resize=780%2C470&ssl=1'
            }
        ]
    });
})

module.exports = command;