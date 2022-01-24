import { Guild } from "../../models/guild.js";
import { createSubCommand } from "../../utilities.js";

const command = createSubCommand('rolename', 'Sets the rolename of Admin',
    (builder) => builder.addStringOption(option =>
        option.setName('name')
            .setDescription('The nickname of the bot')
            .setRequired(true)),
    async (interaction) => {
        const rolename = interaction.options.getString('name', true);

        const guild = await Guild.get(process.env.GUILD_ID as string);

        const id = (await guild.getAdminRoleDetails()).id;

        await interaction.guild?.roles.resolve(id)?.setName(rolename);

        await interaction.reply({ content: `The admin role name has been set successfully!`, ephemeral: true })
    })

export default command;