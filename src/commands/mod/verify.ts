import { AutocompleteInteraction } from 'discord.js';
import { createSubCommand, GUILD, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('verify', 'Verifies a member',
    builder => builder.addStringOption(option => option.setName('user')
        .setDescription('The user to be verified (No options means there\'s currently no users to be verified')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            const users = GUILD.getAllStudents().unverified;
            await (interaction as AutocompleteInteraction).respond(users.map(student => { return { name: student._name, value: student._discordId } }));
            return;
        }

        const user = interaction.options.getString('user', true);

        await interaction.reply({ content: user, ephemeral: true });
    });

export default command;