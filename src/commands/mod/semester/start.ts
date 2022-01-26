
import { GuildChannel, Role } from 'discord.js';
import { createSubCommand, GUILD } from '../../../utilities.js';

const command = createSubCommand('start', 'Intiate semester start command lifecycles.',
    builder => builder,
    async interaction => {
        if (process.env.ENVIRONMENT === 'production') {
            const channel = await interaction.guild?.channels?.resolve('923145032754663464') as GuildChannel;

            const role = await interaction.guild?.roles.resolve(GUILD.getVerifiedRoleDetails().id);

            if (channel.isText()) {
                await channel.send({
                    content: `${role as Role}`,
                    embeds: [{
                        title: `It's that time again!`,
                        description: `Here's a semester-ly prompt to tell y'all to enroll to your new courses!`,
                        thumbnail: {
                            url: interaction.client.user?.displayAvatarURL()
                        },
                        color: 'DARK_GREEN',
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