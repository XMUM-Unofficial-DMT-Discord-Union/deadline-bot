import { createSubCommand, GUILD, prisma } from '../../../utilities.js';

const command = createSubCommand('add', 'Adds a course',
    builder => builder.addStringOption(option => option.setName('name')
        .setDescription('The name of the new course')
        .setRequired(true)),
    async interaction => {
        const name = interaction.options.getString('name', true);

        const course = await GUILD.getCourse(name);

        if (course !== undefined) {
            await interaction.reply({ content: `'${name}' has already existed!`, ephemeral: true });
            return;
        }

        await prisma.course.create({
            data: {
                name: name
            }
        });

        await interaction.reply({ content: `'${name}' has been added!`, ephemeral: true });
    });

export default command;