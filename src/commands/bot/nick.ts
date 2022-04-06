import { createSubCommand } from "../../utilities.js";

const command = createSubCommand('nick', 'Sets the nickname of the bot',
    (builder) => builder.addStringOption(option =>
        option.setName('input')
            .setDescription('The nickname of the bot')),
    async (interaction) => {
        if (interaction.isAutocomplete()) throw `Command \`add\` does not have AutoComplete logic`;

        const nickname = interaction.options.getString('input');

        await interaction.guild?.me?.setNickname(nickname);

        await interaction.reply({ content: `The bot\'s nickname has been set successfully!`, ephemeral: true });
    });

export default command;