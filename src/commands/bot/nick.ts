import { createSubCommand } from "../../utilities";

const command = createSubCommand('nick', 'Sets the nickname of the bot',
    (builder) => builder.addStringOption(option =>
        option.setName('input')
            .setDescription('The nickname of the bot')),
    async (interaction) => {
        const nickname = interaction.options.getString('input');

        await interaction.guild?.me?.setNickname(nickname);

        await interaction.reply({ content: `The bot\'s nickname has been set successfully!`, ephemeral: true })
    })

module.exports = command;