import { AutocompleteInteraction } from 'discord.js';

import { createSubCommand, GUILD } from '../../utilities.js';

const command = createSubCommand('leave', 'Leave a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to leave from')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            await interaction.respond(await (async _ => {
                let result = [];
                for (let course of await GUILD.getAllCourses()) {
                    if (course.students.find(student => student.discordId === interaction.user.id) === undefined)
                        continue;

                    result.push({ name: course.name, value: course.name });
                }

                return result;
            })());
            return;
        }

        const courseName = interaction.options.getString('course', true);

        const course = await GUILD.getCourse(courseName, undefined);

        if (course === undefined) {
            await interaction.reply({ content: `Sorry, there was a problem finding the given course. It probably didn't exist in the database.\nPlease inform the developers about this problem.`, ephemeral: true });
            return;
        }

        if (!await GUILD.removeStudentFromCourse(courseName, interaction.user.id)) {
            await interaction.reply({ content: `Sorry, there was a problem removing you from this course. Please try again later.`, ephemeral: true });
            return;
        }

        await interaction.reply({ content: `You have left '${course.name}'!`, ephemeral: true });
    });

export default command;