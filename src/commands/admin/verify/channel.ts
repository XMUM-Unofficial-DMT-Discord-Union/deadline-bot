import { ActionRowBuilder, ChannelType, Colors, EmbedBuilder, InteractionType, SelectMenuBuilder } from "discord.js";
import { createSubCommand, prisma, resolveBaseCustomId } from "../../../utilities.js";

const GLOBAL_CUSTOMID = resolveBaseCustomId(import.meta.url);

const command = createSubCommand('channel', 'Configure verification notification channel',
    (builder) => builder,
    async (interaction) => {
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) throw `Command \`add\` does not have AutoComplete logic`;

        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder({
            title: 'Verification Notification Channel',
            description: `Choose a new channel for new verifications.`,
            color: Colors.Yellow,
            author: {
                name: interaction.client.user!.tag!,
                icon_url: interaction.client.user!.displayAvatarURL()
            },
            footer: {
                text: `Sent on ${new Date().toLocaleString()} with ❤️`
            }
        });

        const channels = await interaction.guild!.channels.fetch();

        const guild = await prisma.guild.findUnique({
            where: {
                id: interaction.guildId!
            }
        });

        if (guild === null) {
            await interaction.followUp({ content: `Oops, looks like there was a problem when finding this guild in database. Please report this to the devs!`, ephemeral: true });
            return;
        }

        const validChannels = channels.filter(value => value.type === ChannelType.GuildText && value.id !== guild.verificationNotifyChannel);

        const component = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenuBuilder({
                    custom_id: GLOBAL_CUSTOMID,
                    options: validChannels.map(channel => {
                        return {
                            label: channel.name,
                            value: channel.id
                        };
                    })
                })
            );

        await interaction.followUp({ embeds: [embed], components: [component], ephemeral: true });
    },
    undefined,
    async componentInteraction => {
        if (componentInteraction.isSelectMenu()) {
            await prisma.guild.update({
                where: {
                    id: componentInteraction.guildId as string
                },
                data: {
                    verificationNotifyChannel: componentInteraction.values[0]
                }
            });

            const embed = EmbedBuilder.from(componentInteraction.message.embeds[0])
                .setColor(Colors.Green)
                .setDescription(null)
                .setTitle(componentInteraction.message.embeds[0].title + ' :white_check_mark:');

            await componentInteraction.update({ embeds: [embed], components: [] });
        }
    });

export default command;