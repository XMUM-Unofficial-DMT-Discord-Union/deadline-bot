import { AutocompleteInteraction } from 'discord.js';

import { createSubCommand, GUILD } from '../../utilities.js';

const command = createSubCommand('enroll', 'Enroll into a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to enroll into')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {

        if (interaction.isAutocomplete()) {
            await (interaction as AutocompleteInteraction).respond((_ => {
                let result = [];
                for (let course of Object.values(GUILD.getAllCourses())) {
                    if (course.students.includes((interaction as AutocompleteInteraction).user.id))
                        continue;

                    result.push({ name: course.name, value: course.name })
                }

                return result;
            })());
            return;
        }

        const courseName = interaction.options.getString('course', true);

        const course = GUILD.getCourse(courseName);

        if (course === undefined) {
            await interaction.reply({ content: `Sorry, there was a problem finding the given course. It probably didn't exist in the database.\nPlease inform the developers about this problem.`, ephemeral: true });
            return;
        }

        if (!GUILD.addStudentToCourse(courseName, interaction.user.id, interaction.client)) {
            await interaction.reply({ content: `Sorry, there was a problem adding you to this course. Please try again later.`, ephemeral: true });
            return;
        }

        await GUILD.save();

        await interaction.reply({ content: `You have been enrolled into '${course.name}'!`, ephemeral: true });
    })

export default command;