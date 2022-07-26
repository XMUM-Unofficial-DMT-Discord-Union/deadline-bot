
import { ChannelType, Colors, GuildChannel, InteractionType, TextChannel, } from 'discord.js';
import Discord from 'discord.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

const command = createSubCommand('start', 'Intiate semester start command lifecycles.',
    builder => builder,
    async interaction => {
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) throw `Command \`add\` does not have AutoComplete logic`;

        if (process.env.ENVIRONMENT === 'production') {
            const channel = await interaction.guild?.channels?.resolve('923145032754663464') as GuildChannel;

            const role = await interaction.guild?.roles.resolve((await GUILD.getVerifiedRole(interaction.guildId as string, interaction.client)).id);

            if (channel.type == ChannelType.GuildText) {
                await (channel as TextChannel).send({
                    content: `${role as Discord.Role}`,
                    embeds: [{
                        title: `It's that time again!`,
                        description: `Here's a semester-ly prompt to tell y'all to enroll to your new courses!`,
                        thumbnail: {
                            url: interaction.client.user!.displayAvatarURL()
                        },
                        color: Colors.DarkGreen,
                        footer: {
                            text: `Sent on ${new Date().toLocaleString()} with ❤️`
                        }

                    }]
                });

                await interaction.reply({ content: `Pinged everyone!`, ephemeral: true });
            }
        }
    }
);

export default command;