import { AutocompleteInteraction } from 'discord.js';

import { createSubCommand, GUILD } from '../../utilities.js';

const command = createSubCommand('leave', 'Leave a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to leave from')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            await (interaction as AutocompleteInteraction).respond((_ => {
                let result = [];
                for (let course of Object.values(GUILD.getAllCourses())) {
                    if (!course.students.includes((interaction as AutocompleteInteraction).user.id))
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

        course.students = course.students.filter(student => student !== interaction.user.id);
        GUILD.updateCourse(course);
        await GUILD.save();

        await interaction.reply({ content: `You have left '${course.name}'!`, ephemeral: true });
    })

export default command;