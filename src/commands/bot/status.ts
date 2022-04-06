import humanizeDuration from 'humanize-duration';

import { EmbedBuilder } from "@discordjs/builders";

import { createSubCommand } from "../../utilities.js";

const command = createSubCommand('status', 'Shows the current status of the bot', (_) => _, async (interaction) => {
    if (interaction.isAutocomplete()) throw `Command \`add\` does not have AutoComplete logic`;


    const embed = new EmbedBuilder({
        author: {
            name: interaction.guild?.me?.nickname as string,
        },
        title: 'Bot Status',
        description: 'A *simple* bot made to keep track of deadlines. :skull::skull::skull:',
        fields: [
            {
                name: 'Uptime',
                value: humanizeDuration(interaction.client.uptime as number),
                inline: true
            },
            {
                name: 'Version',
                value: 'v1.0',
                inline: true
            }
        ],
        image: {
            url: interaction.client.user?.displayAvatarURL() as string
        },
        footer: {
            text: 'Made by: siew24',
            icon_url: 'https://cdn.discordapp.com/avatars/392436823349002240/03adefe43dd223bf4fc8c942dcdeaaf8.webp?size=32'
        },
    });

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
});

export default command;