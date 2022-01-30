import { createSubCommand } from '../../utilities.js';

const command = createSubCommand('aboutme', 'Information about the bot',
    builder => builder,
    async interaction => {
        await interaction.reply({
            embeds: [{
                title: 'Bot Information',
                description: 'Some technical details on what technology the bot was built on.',
                color: '#ff00e6',
                thumbnail: {
                    url: interaction.client.user?.displayAvatarURL()
                },
                fields: [{
                    name: 'Language',
                    value: '[TypeScript](https://www.typescriptlang.org/)'
                }, {
                    name: 'Framework',
                    value: '[Discord.js](https://discord.js.org)'
                }],
                footer: {
                    text: `Sent on ${new Date().toLocaleString()} with ❤️`
                }
            }]
        })
    });

export default command;