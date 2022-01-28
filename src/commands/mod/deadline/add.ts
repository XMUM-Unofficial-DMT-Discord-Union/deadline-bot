import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import { AutocompleteInteraction } from 'discord.js';
import { Course } from '../../../models/course.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

const command = createSubCommand('add', 'Adds a deadline',
    builder => builder.addStringOption(option => option.setName('course')
        .setDescription('The course to associate this deadline with')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(option => option.setName('name')
            .setDescription('The name of this deadline')
            .setRequired(true))
        .addStringOption(option => option.setName('datetime')
            .setDescription('The deadline date time. In the form of DD/MM/YYYY, hh:mm:ss')
            .setRequired(true))
        .addStringOption(option => option.setName('description')
            .setDescription('The description of this deadline'))
        .addStringOption(option => option.setName('url')
            .setDescription('The direct url referring to this deadline in Moodle.')),
    async interaction => {
        if (interaction.isAutocomplete()) {
            await (interaction as AutocompleteInteraction).respond(
                Object.keys(GUILD.getAllCourses()).map(courseName => {
                    return { name: courseName, value: courseName };
                }));
            return;
        }

        const course = GUILD.getCourse(interaction.options.getString('course', true)) as Course;
        const name = interaction.options.getString('name', true);

        dayjs.extend(customParseFormat);
        const datetime = dayjs(interaction.options.getString('datetime', true), 'DD/MM/YYYY, HH:mm:ss', 'ms_MY', true);
        if (!datetime.isValid() || datetime.isBefore(dayjs())) {
            await interaction.reply({ content: `Unfortunately, this date is either invalid or is in the past, please try again!`, ephemeral: true });
            return;
        }

        const description = interaction.options.getString('description');
        const url = interaction.options.getString('url');

        // Now we can build the deadline
        const deadline = {
            name: name,
            description: description === null ? '' : description,
            datetime: datetime.toDate(),
            url: url === null ? '' : url,
            excluded: []
        }

        // TODO: Custom Embeds for each student
        GUILD.addDeadlineToCourse(course.name, deadline, interaction.client);

        await GUILD.save();

        await interaction.reply({ content: `New deadline created!`, ephemeral: true });
    });

export default command;