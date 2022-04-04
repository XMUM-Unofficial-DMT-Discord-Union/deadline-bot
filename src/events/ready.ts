import { Client } from "discord.js";

export default {
    once: true,
    name: 'ready',
    async execute(client: Client) {
        const devServer = client.guilds.cache.get('778117614215495701');

        await devServer?.systemChannel?.send({
            content: 'Deadline Bot',
            embeds: [
                {
                    author: {
                        name: 'siew24',
                        icon_url: 'https://cdn.discordapp.com/avatars/392436823349002240/03adefe43dd223bf4fc8c942dcdeaaf8.webp?size=32'
                    },
                    image: {
                        url: client.application?.iconURL() as string
                    },
                    title: 'Bot status',
                    description: 'Bot has started!'
                }
            ]
        });
    }
};