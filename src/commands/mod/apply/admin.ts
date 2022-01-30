import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageCollector, TextBasedChannel } from 'discord.js';
import { Application } from '../../../models/guild.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

const ID_STATES: {
    [discordId: string]: number
} = {};

type Response = Application

type CallbackReturn = [Response, boolean];

const yesButton = new MessageButton()
    .setCustomId('yes')
    .setLabel('Yes')
    .setStyle('PRIMARY')

const noButton = new MessageButton()
    .setCustomId('no')
    .setLabel('no')
    .setStyle('PRIMARY')

const callbacks = [
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, isSuccess: boolean, collector: any): Promise<CallbackReturn> => {
        await interaction.editReply({
            embeds: [{
                title: 'Admin Application',
                description: `Please enter your name.`
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, isSuccess: boolean, collector: any): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.name = message.content;
            await message.delete();
        }

        await interaction.editReply({
            embeds: [{
                title: 'Admin Application',
                description: `Please state why we should consider your application as an Admin.`
            }]
        });

        return [response, true];
    },
    async (interaction: CommandInteraction, message: Message | undefined, response: Response, isSuccess: boolean, collector: any): Promise<CallbackReturn> => {
        if (message !== undefined) {
            response.reason = message.content;
            await message.delete();
        }

        const reply = await interaction.editReply({
            embeds: [{
                title: 'Is this correct? (Respond with yes/no)',
                fields: [
                    {
                        name: 'Name',
                        value: response.name || '\`None\`'
                    },
                    {
                        name: 'Reason',
                        value: response.reason
                    }
                ]
            }],
            components: [new MessageActionRow()
                .addComponents([yesButton, noButton])]
        }) as Message;

        const componentCollector = reply.createMessageComponentCollector({
            componentType: 'BUTTON',
            filter: interactor => interactor.user.id === interaction.user.id,
            idle: 30000
        })
            .on('collect', async componentInteraction => {
                if (componentInteraction.customId === 'no') {
                    ID_STATES[interaction.user.id] = 0;

                    [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, undefined, response, isSuccess, collector);
                }
                else {
                    componentCollector.stop();
                    collector.stop();
                    await componentInteraction.update({ components: [] });

                    GUILD.addApplication(response);
                    await GUILD.save();

                    await interaction.editReply({
                        embeds: [{
                            title: 'Admin Application ✅',
                            color: 'GREEN'
                        }]
                    });
                }
            })
            .on('stop', async () => {

                const disabled = reply.components[0].components;
                disabled.forEach(component => component.setDisabled(true));
                await interaction.editReply({
                    components: [new MessageActionRow()
                        .setComponents(disabled)]
                })
            })


        return [response, true];

    }];

async function questionsLifecycle(interaction: CommandInteraction) {
    ID_STATES[interaction.user.id] = 0;
    let response: Application = {
        name: '',
        type: 'admin',
        reason: ''
    }
    let isSuccess = true;

    const reply = await interaction.reply({
        embeds: [{
            title: 'Admin Application',
            description: `Please enter the your name.`
        }],
        fetchReply: true,
        ephemeral: true
    }) as Message;

    ID_STATES[interaction.user.id]++;

    const collector = new MessageCollector(interaction.channel as TextBasedChannel, {
        filter: message => message.author.id === interaction.user.id,
        idle: 30000
    })
        .on('collect', async message => {
            [response, isSuccess] = await callbacks[ID_STATES[interaction.user.id]++](interaction, message, response, isSuccess, collector);

            if (!isSuccess) {
                ID_STATES[interaction.user.id] -= 1;
                await interaction.followUp({ content: `Invalid response.`, ephemeral: true });
            }
        })
}

const command = createSubCommand('admin', 'Apply for admin role',
    builder => builder,
    async interaction => {
        await questionsLifecycle(interaction);
    });

export default command;