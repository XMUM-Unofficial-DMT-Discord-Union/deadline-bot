import { ApplicationCommandOptionChoice, AutocompleteInteraction } from 'discord.js';
import { createSubCommand, GUILD } from '../../utilities.js';

const command = createSubCommand('dev', 'Report a dev',
    builder => builder.addStringOption(option => option.setName('user')
        .setDescription('The developer to be reported')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(option => option.setName('reason')
            .setDescription('The reason of reporting this developer')
            .setRequired(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            let result: ApplicationCommandOptionChoice[] = [];

            let students = GUILD.getAllStudents().verified;

            await (interaction as AutocompleteInteraction).respond(students.reduce(
                (result, student) => {
                    if (student._type.includes('dev'))
                        result.push({ name: student._discordName, value: student._discordId });

                    return result;
                }, result));
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        GUILD.addReport({
            type: 'dev',
            discordId: interaction.options.getString('user', true),
            datetime: new Date(),
            reason: interaction.options.getString('reason', true)
        });

        await GUILD.save();

        await interaction.followUp({ content: 'Report sent!', ephemeral: true })
    });

export default command;