import { Embed, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CacheType, Message, MessageActionRow, MessageButton, MessageComponentInteraction } from "discord.js";
import { ISubCommand } from '../../types';

const command: ISubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('status')
        .setDescription('Shows the current status of the bot'),
    async execute(interaction) {
        const time = new Date(Date.UTC(0, 0, 0, 0, 0, 0, interaction.client.uptime as number));

        const parts = [time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds()];

        // Initialize buttons
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('next-page')
                    .setLabel('Next Page')
                    .setStyle('PRIMARY')
            )

        // Development Status
        const status = [['/admin', '0/2'], ['/mod', '0/7'], ['/', '0/9']];

        const embed = new Embed({
            author: {
                name: interaction.guild?.me?.nickname as string,
            },
            title: 'Bot Status',
            description: 'A simple bot made to :skull:',
            fields: [
                {
                    name: 'Uptime',
                    value: parts.map(part => String(part).padStart(2, '0')).join(':'),
                    inline: true
                },
                {
                    name: 'Development Status',
                    value: '/admin',
                    inline: true
                }
            ],
            image: {
                url: interaction.guild?.me?.displayAvatarURL() as string
            },
            footer: {
                text: 'Made by: siew24',
                icon_url: 'https://cdn.discordapp.com/avatars/392436823349002240/03adefe43dd223bf4fc8c942dcdeaaf8.webp?size=32'
            }
        });

        await interaction.reply({
            content: "```md\n# TODO\n\n/admin (subcommand)\n * mod\n   * add\n   * remove\n * nick (name)\n\n/mod (subcommand)\n * deadline (subcommand)\n   * add (name) (reminder -> default: 1 week) ()\n   * delete (name)\n   * edit (name) (reminder)\n   * extend\n * kick (player) (reason)\n * ban (player) (reason)\n * verify\n * course\n   * add (name)\n   * remove (name)\n * semester\n   * start // Prompt everyone to select course roles\n   * end // Clear everyone's course roles\n * apply\n   * admin\n\n/ (command) \n * course\n * enroll(name) \n * leave(name) \n * bot\n * aboutme\n * status\n * ping\n * bonk\n * serverinfo\n * suggest\n * deadline\n * list(optional: verbose) // Lists all deadlines\n   * info (choice: name)\n * report\n   * mod (name) (reason) (optional: attachment/link to a text message)\n * apply\n   * mod\n   * dev\n\nFuture Commands\n=========\n * Allow members to suggest changing incorrect deadlines\n * Dynamic role permissions upon new channel\n * Display channel info on invocated channel\n```",
            embeds: [embed],
            ephemeral: true
        });
    }
}

module.exports = command;