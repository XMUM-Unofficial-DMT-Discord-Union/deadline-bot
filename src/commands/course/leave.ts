import { AutocompleteInteraction, CacheType } from 'discord.js';
import { Course } from '../../models/course.js';

import { Guild } from '../../models/guild.js';
import { createSubCommand } from '../../utilities.js';

const guild = await Guild.get(process.env.GUILD_ID as string);

let courses: Course[] = [];

const command = createSubCommand('leave', 'Leave a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to leave from')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        const courseName = interaction.options.getString('course', true);

        if (interaction.isAutocomplete()) {
            courses = await guild.getAllCourses();
            await (interaction as AutocompleteInteraction).respond((_ => {
                let result = [];
                for (let course of courses) {
                    if (!course._students.includes((interaction as AutocompleteInteraction).user.id))
                        continue;

                    result.push({ name: course._name, value: course._name })
                }

                return result;
            })());
            return;
        }

        const course = courses.find(value => value._name === courseName);

        if (course === undefined) {
            await interaction.reply({ content: `Sorry, there was a problem finding the given course. It probably didn't exist in the database.\nPlease inform the developers about this problem.`, ephemeral: true });
            return;
        }

        course._students.filter(student => student !== interaction.user.id);
        guild.updateCourse(course);
        await guild.save();

        await interaction.reply({ content: `You have left '${course._name}'!`, ephemeral: true });
    })

export default command;