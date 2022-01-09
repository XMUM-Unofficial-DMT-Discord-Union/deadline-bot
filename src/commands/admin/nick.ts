import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { ISubCommand } from '../../types';

const command: ISubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('nick')
        .setDescription('Sets the nickname of the bot.')
        .addStringOption(option => option.setName('input').setDescription('The nickname of the bot.').setRequired(true)),
    async execute(interaction) {
        const nickname = interaction.options.getString('input');

        await interaction.guild?.me?.setNickname(nickname);

        await interaction.reply({ content: `The bot\'s nickname has been set successfully!`, ephemeral: true })
    }
}

module.exports = command;