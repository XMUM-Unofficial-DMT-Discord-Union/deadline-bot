
import { createSubCommand, GUILD, prisma } from '../../../utilities.js';

const command = createSubCommand('end', 'Disenroll everyone from their courses',
    builder => builder,
    async interaction => {
        const courses = await GUILD.getAllCourses();

        await interaction.reply({ content: `Disenrolling everyone...`, ephemeral: true });

        let description = '';
        let pending = false;
        for (let course of courses) {
            if (course.students.length === 0)
                continue;

            pending = true;
            let count = course.students.length;

            await prisma.course.update({
                where: {
                    id: course.id
                },
                data: {
                    students: {
                        set: []
                    }
                },
                include: {
                    students: true
                }
            });

            description += `Disenrolled ${count} students from \`${course.name}\`.\n`;
            await interaction.editReply({ content: description });
        }

        if (pending)
            await interaction.editReply({ content: `All students have been disenrolled!` });
        else
            await interaction.editReply({ content: 'There seems to be no students to disenroll from... is that on purpose?' });
    });

export default command;