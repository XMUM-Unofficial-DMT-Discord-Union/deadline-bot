import { AutocompleteInteraction } from 'discord.js';

import { createSubCommand, GUILD, prisma } from '../../../utilities.js';

const command = createSubCommand('remove', 'Removes a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to remove')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            await interaction.respond((await GUILD.getAllCourses()).map(course => { return { name: course.name, value: course.name }; }));
            return;
        }

        const courseName = interaction.options.getString('course', true);

        const course = await prisma.course.findUnique({
            where: {
                name: courseName
            }
        });

        if (course === null)
            await interaction.reply({ content: `something went wrong when trying to delete '${courseName}'. Please try again.`, ephemeral: true });
        else {

            await prisma.course.delete({
                where: {
                    name: courseName
                }
            });
            await interaction.reply({ content: `Successfully deleted '${courseName}'!`, ephemeral: true });
        }
    });

export default command;