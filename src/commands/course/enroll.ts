import { ApplicationCommandOptionChoice, AutocompleteInteraction, CacheType } from 'discord.js';
import { Course } from '../../models/course.js';

import { Guild } from '../../models/guild.js';
import { createSubCommand } from '../../utilities.js';

const guild = await Guild.get(process.env.GUILD_ID as string);

let courses: Course[] = [];

const command = createSubCommand('enroll', 'Enroll into a course',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to enroll into')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {

        if (interaction.isAutocomplete()) {
            courses = await guild.getAllCourses();
            await (interaction as AutocompleteInteraction).respond((_ => {
                let result = [];
                for (let course of courses) {
                    if (course._students.includes((interaction as AutocompleteInteraction).user.id))
                        continue;

                    result.push({ name: course._name, value: course._name })
                }

                return result;
            })());
            return;
        }

        const courseName = interaction.options.getString('course', true);

        const course = courses.find(course => course._name === courseName);

        if (course === undefined) {
            await interaction.reply({ content: `Sorry, there was a problem finding the given course. It probably didn't exist in the database.\nPlease inform the developers about this problem.`, ephemeral: true });
            return;
        }

        course._students.push(interaction.user.id);
        guild.updateCourse(course);
        await guild.save();

        await interaction.reply({ content: `You have been enrolled into '${course._name}'!`, ephemeral: true });
    })

export default command;