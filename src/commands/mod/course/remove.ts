import { AutocompleteInteraction } from 'discord.js';

import { createSubCommand, GUILD } from '../../../utilities.js';

const command = createSubCommand('remove', 'Removes a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to remove')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            await (interaction as AutocompleteInteraction)
                .respond(Object.keys(GUILD.getAllCourses()).map(courseName => { return { name: courseName, value: courseName }; }));
            return;
        }

        const courseName = interaction.options.getString('course', true);

        if (!GUILD.deleteCourse(courseName))
            await interaction.reply({ content: `something went wrong when trying to delete '${courseName}'. Please try again.`, ephemeral: true });
        else {
            await GUILD.save();
            await interaction.reply({ content: `Successfully deleted '${courseName}'!`, ephemeral: true });
        }
    });

export default command;