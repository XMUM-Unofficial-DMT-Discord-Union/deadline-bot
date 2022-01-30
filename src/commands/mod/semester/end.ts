
import { createSubCommand, GUILD } from '../../../utilities.js';

const command = createSubCommand('end', 'Disenroll everyone from their courses',
    builder => builder,
    async interaction => {
        const courses = GUILD.getAllCourses();

        await interaction.reply({ content: `Disenrolling everyone...`, ephemeral: true });

        let description = '';
        let pending = false;
        for (let course of Object.values(courses)) {
            if (course.students.length === 0)
                continue;

            pending = true;
            let count = course.students.length;
            course.students = [];

            GUILD.updateCourse(course);

            description += `Disenrolled ${count} students from \`${course.name}\`.\n`
            await interaction.editReply({ content: description });
        }
        if (pending) {
            await GUILD.save();
            await interaction.editReply({ content: `All students have been disenrolled!` });
        }
        else
            await interaction.editReply({ content: 'There seems to be no students to disenroll from... is that on purpose?' });
    });

export default command;