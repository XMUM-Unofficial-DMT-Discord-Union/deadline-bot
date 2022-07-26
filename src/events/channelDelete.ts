import { EmbedBuilder, DMChannel, GuildChannel, Colors, ChannelType } from "discord.js";

import { prisma } from '../utilities.js';

export default {
    once: false,
    name: 'channelDelete',
    async execute(channel: DMChannel | GuildChannel) {

        if (channel.type == ChannelType.DM) return;

        if (channel.type != ChannelType.GuildText) return;

        const guild = await prisma.guild.findUnique({
            where: {
                id: channel.guildId
            }
        });

        if (guild === null) return;

        if (channel.id === guild.verificationNotifyChannel) {
            await prisma.guild.update({
                where: {
                    id: channel.guildId
                },
                data: {
                    verificationNotifyChannel: null
                }
            });

            const ownerEmbed = new EmbedBuilder({
                title: 'Verification Notification Channel Deleted',
                description: `Please set a channel for new verification notifications!`,
                color: Colors.Red,
                author: {
                    name: channel.client.user!.tag!,
                    icon_url: channel.client.user!.displayAvatarURL()
                },
                footer: {
                    text: `Sent on ${new Date().toLocaleString()} with ❤️`
                }
            });

            await (await (await channel.guild.fetchOwner()).createDM()).send({
                embeds: [ownerEmbed]
            });

            return;
        }
    }
};