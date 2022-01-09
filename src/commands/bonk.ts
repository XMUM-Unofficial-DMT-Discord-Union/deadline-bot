import { SlashCommandBuilder } from "@discordjs/builders";
import { ICommand } from "../types";

const command: ICommand = {
    data: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('BONK someone!'),
    async execute(interaction) {

        await interaction.reply({
            files: [
                {
                    name: 'bonk.png',
                    attachment: 'https://i1.wp.com/tubeindian.in/wp-content/uploads/BONK-MEME.jpg?resize=780%2C470&ssl=1'
                }
            ]
        })
    }
}

module.exports = command;