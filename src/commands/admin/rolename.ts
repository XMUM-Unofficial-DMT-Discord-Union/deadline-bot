import { InteractionType } from "discord.js";
import { createSubCommand, GUILD } from "../../utilities.js";

const command = createSubCommand('rolename', 'Sets the rolename of Admin',
    (builder) => builder.addStringOption(option =>
        option.setName('name')
            .setDescription('The nickname of the bot')
            .setRequired(true)),
    async (interaction) => {
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) throw `Command \`add\` does not have AutoComplete logic`;

        const rolename = interaction.options.getString('name', true);

        const id = (await GUILD.getAdminRole(interaction.guildId as string, interaction.client)).id;

        await interaction.guild?.roles.resolve(id)?.setName(rolename);

        await interaction.reply({ content: `The admin role name has been set successfully!`, ephemeral: true });
    });

export default command;