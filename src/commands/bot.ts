import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection } from 'discord.js';
import { ICommand, ISubCommand } from '../types';
import directoryFiles from '../utilities';

const command: ICommand = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot related commands.'),
    subcommands: new Collection(),
    async execute(interaction) {
        this.subcommands?.get(interaction.options.getSubcommand() as string)?.execute(interaction);
    }
}

for (const subcommand of directoryFiles<ISubCommand>(__filename, 'bot')) {
    command.data.addSubcommand(subcommand.data);
    command.subcommands?.set(subcommand.data.name, subcommand);
}

module.exports = command;