import { AutocompleteInteraction, Message, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle, Colors, EnumResolvers, ButtonComponent } from 'discord.js';
import { createSubCommand, GUILD, prisma } from '../../utilities.js';

const component = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setLabel('Reject')
            .setCustomId('no')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('yes')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
    );

const command = createSubCommand('verify', 'Verifies a member',
    builder => builder.addStringOption(option => option.setName('user')
        .setDescription('The user to be verified (No options means there\'s currently no users to be verified')
        .setRequired(true)
        .setAutocomplete(true)),
    async interaction => {
        if (interaction.isAutocomplete()) {
            const users = await prisma.student.findMany({
                where: {
                    guilds: {
                        some: {
                            id: (interaction as AutocompleteInteraction)?.guildId as string
                        }
                    },
                    studentsToRoles: {
                        some: {
                            roleType: {
                                equals: 'UNVERIFIED'
                            }
                        }
                    }
                }
            });
            await (interaction as AutocompleteInteraction).respond(users.map(student => { return { name: student.name, value: student.discordId }; }));
            return;
        }

        const discordId = interaction.options.getString('user', true);

        const student = await prisma.student.findUnique({
            where: {
                discordId: interaction.user.id
            }
        });

        if (student === null) {
            await interaction.reply({ content: `There seems to be a out-of-sync problem with the database. Please try again.`, ephemeral: true });
            return;
        }

        const member = await interaction.guild?.members.fetch(discordId);

        if (member === undefined) {
            await interaction.reply({ content: 'I don\'t know how you got here, but this part of the code shouldn\'t even be able to run!', ephemeral: true });
            return;
        }

        const reply = await interaction.reply({
            embeds: [{
                title: `Verification Details`,
                description: `Candidate Name: \`${student.name}\``,
                color: 15717381, // #efd405
                fields: [{
                    name: 'Student ID',
                    value: `\`${student.id}\``,
                    inline: true
                },
                {
                    name: 'Discord Tag',
                    value: `\`${interaction.user.tag}\'`,
                    inline: true
                },
                {
                    name: 'Enrolled Batch',
                    value: `\`${student.enrolledBatch}\``,
                    inline: true
                }]
            }],
            components: [component],
            fetchReply: true,
            ephemeral: true
        }) as Message;

        const collector = reply.createMessageComponentCollector({ filter: button => button.user.id === interaction.user.id, componentType: ComponentType.Button, idle: 30000, max: 1 })
            .on('collect', async componentInteraction => {

                const localComponents = componentInteraction.message.components;

                const updatedComponents = localComponents![0].components.map(component => ButtonBuilder.from(component as ButtonComponent).setDisabled(true));

                await componentInteraction.update({
                    components: [new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(...updatedComponents)]
                });

                collector.stop();

                if (componentInteraction.customId === 'cancel') {
                    await interaction.editReply({
                        embeds: [{
                            title: 'Verification Cancelled',
                            color: Colors.Grey
                        }],
                        components: []
                    });
                }
                else if (componentInteraction.customId === 'no') {

                    // TODO: Notify student that verification is rejected
                    await prisma.student.delete({
                        where: {
                            discordId: student.discordId
                        }
                    });

                    await interaction.editReply({
                        embeds: [{
                            title: 'Member Denied! ⛔',
                            color: Colors.Red
                        }],
                        components: []
                    });
                } else if (componentInteraction.customId === 'yes') {

                    await prisma.student.update({
                        where: {
                            discordId: student.discordId
                        },
                        data: {
                            studentsToRoles: {
                                deleteMany: {
                                    guildId: member.guild.id,
                                    studentDiscordId: member.id,
                                    roleType: 'UNVERIFIED'
                                },
                                create: {
                                    guildId: member.guild.id,
                                    roleType: 'VERIFIED'
                                }
                            }
                        }
                    });

                    await member.roles.add((await GUILD.getVerifiedRole(interaction.guildId as string, interaction.client)).id);

                    // Also add batch role - first fetch the role
                    let role = await member.guild.roles.cache.find(role => role.name === student.enrolledBatch);

                    if (role === undefined)
                        role = await member.guild.roles.create({
                            name: student.enrolledBatch,
                            hoist: true,
                            color: '#2ECC71'
                        });

                    await member.roles.add(role);

                    await interaction.editReply({
                        embeds: [{
                            title: 'Member Verified! ✅',
                            color: Colors.Green
                        }],
                        components: []
                    });
                }
            });
    });

export default command;