import { AutocompleteInteraction, Message, MessageActionRow } from 'discord.js';
import { createSubCommand, GUILD } from '../../utilities.js';

const component = new MessageActionRow()
    .addComponents([{
        type: 'BUTTON',
        customId: 'cancel',
        label: 'Cancel',
        style: 'PRIMARY'
    },
    {
        type: 'BUTTON',
        customId: 'no',
        label: 'Reject',
        style: 'PRIMARY'
    },
    {
        type: 'BUTTON',
        customId: 'yes',
        label: 'Accept',
        style: 'PRIMARY'
    }])


const command = createSubCommand('verify', 'Verifies a member',
    builder => builder.addStringOption(option => option.setName('user')
        .setDescription('The user to be verified (No options means there\'s currently no users to be verified')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            const users = GUILD.getAllStudents().unverified;
            await (interaction as AutocompleteInteraction).respond(users.map(student => { return { name: student._name, value: student._discordId } }));
            return;
        }

        const discordId = interaction.options.getString('user', true);

        const student = GUILD.getStudent(discordId);

        if (student === undefined) {
            await interaction.reply({ content: `There seems to be a out-of-sync problem with the database. Please try again.`, ephemeral: true });
            return;
        }

        const member = await interaction.guild?.members.fetch(discordId);

        if (member === undefined) {
            await interaction.reply({ content: 'I don\'t know how you got here, but this part of the code shouldn\'t even be able to run!', ephemeral: true })
            return;
        }

        const reply = await interaction.reply({
            embeds: [{
                title: `Verification Details`,
                description: `Candidate Name: \`${student._name}\``,
                color: '#efd405',
                fields: [{
                    name: 'Student ID',
                    value: `\`${student._id}\``,
                    inline: true
                },
                {
                    name: 'Discord Tag',
                    value: `\`${student._discordName}\``,
                    inline: true
                },
                {
                    name: 'Enrolled Batch',
                    value: `\`${student._enrolledBatch}\``,
                    inline: true
                }]
            }],
            components: [component],
            fetchReply: true,
            ephemeral: true
        }) as Message;

        const collector = reply.createMessageComponentCollector({ filter: button => button.user.id === interaction.user.id, componentType: 'BUTTON', idle: 30000, max: 1 })
            .on('collect', async componentInteraction => {

                const localComponents = (componentInteraction.message.components as MessageActionRow[]);

                localComponents[0].components.forEach(component => component.disabled = true);

                await componentInteraction.update({ components: localComponents });

                collector.stop();

                if (componentInteraction.customId === 'cancel') {
                    await interaction.editReply({
                        embeds: [{
                            title: 'Verification Cancelled',
                            color: 'GREY'
                        }],
                        components: []
                    })
                }
                else if (componentInteraction.customId === 'no') {

                    GUILD.removeUnverifiedStudent(student);
                    await GUILD.save();

                    await interaction.editReply({
                        embeds: [{
                            title: 'Member Denied! ⛔',
                            color: 'RED'
                        }],
                        components: []
                    })
                } else if (componentInteraction.customId === 'yes') {

                    GUILD.verifyStudent(student);
                    await GUILD.save();

                    await member.roles.add(GUILD.getVerifiedRoleDetails().id);

                    await interaction.editReply({
                        embeds: [{
                            title: 'Member Verified! ✅',
                            color: 'GREEN'
                        }],
                        components: []
                    })
                }
            })
    });

export default command;