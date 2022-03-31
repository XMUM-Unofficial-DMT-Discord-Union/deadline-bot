import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageCollector, TextBasedChannel } from 'discord.js';
import { Permissions } from '../types.js';
import { createCommand, GUILD } from '../utilities.js';

type Response = { name: string, id: string, enrolledBatch: string; };
type CallBackReturn = [Response, boolean];

const yesButton = new MessageButton()
    .setCustomId('yes')
    .setLabel('Yes')
    .setStyle('PRIMARY');

const noButton = new MessageButton()
    .setCustomId('no')
    .setLabel('no')
    .setStyle('PRIMARY');

const callbacks = [
    async (interaction: CommandInteraction, message: Message, response: Response): Promise<CallBackReturn> => {
        response.name = message.content;
        await message.delete();

        await interaction.editReply({
            embeds: [{
                title: 'Please enter your student id.'
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message, response: Response): Promise<CallBackReturn> => {
        response.id = message.content;
        await message.delete();

        await interaction.editReply({
            embeds: [{
                title: 'Please enter your enrolled batch number (eg. 2004, 2009)'
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message, response: Response): Promise<CallBackReturn> => {
        response.enrolledBatch = message.content;
        await message.delete();

        await interaction.editReply({
            embeds: [{
                title: 'Is this correct? (Respond with yes/no)',
                fields: [
                    {
                        name: 'Name',
                        value: response.name
                    },
                    {
                        name: 'Student ID',
                        value: response.id
                    },
                    {
                        name: 'Enrolled Batch Number',
                        value: response.enrolledBatch
                    }
                ]
            }],
            components: [new MessageActionRow()
                .addComponents([yesButton, noButton])]
        });

        return [response, true];
    }];

const command = createCommand('verify', 'Helps us to validate that you are an XMUM Student!', Permissions.NOTVERIFIED,
    builder => builder,
    async interaction => {
        let id = 0;
        let response = {
            name: '',
            id: '',
            enrolledBatch: ''
        };

        let reply = await interaction.reply({
            embeds: [{
                title: 'Please enter your name.'
            }], fetchReply: true, ephemeral: true
        }) as Message;

        let lastCollector: any = undefined;

        let collector = new MessageCollector(interaction.channel as TextBasedChannel, { filter: message => message.author.id === interaction.user.id, idle: 30000 })
            .on('collect', async message => {
                if (id >= 2 && lastCollector === undefined) {
                    lastCollector = reply.createMessageComponentCollector({ componentType: 'BUTTON', idle: 30000 })
                        .on('collect', async (componentInteraction) => {
                            yesButton.setDisabled(true);
                            noButton.setDisabled(true);
                            await componentInteraction.update({ components: [new MessageActionRow().addComponents([yesButton, noButton])] });

                            // Restart the process
                            if (componentInteraction.customId === 'no') {
                                id = 0;
                                lastCollector.stop();

                                yesButton.setDisabled(false);
                                noButton.setDisabled(false);

                                await interaction.editReply({
                                    embeds: [{
                                        title: 'Please enter your name.'
                                    }], components: []
                                });

                                return;
                            }
                            else {
                                await interaction.editReply({
                                    embeds: [{
                                        title: 'Success!',
                                        description: 'You can now clear this message.'
                                    }],
                                    components: []
                                });
                                collector.stop();

                                await GUILD.addUnverifiedStudent({
                                    ...response,
                                    discordId: interaction.user.id,
                                    guildId: interaction.guildId as string
                                });
                            }
                        });
                }

                if (id < callbacks.length) {
                    let [result, _] = await callbacks[id++](interaction, message, response);

                    response = result;
                }
            });
    });

export default command;