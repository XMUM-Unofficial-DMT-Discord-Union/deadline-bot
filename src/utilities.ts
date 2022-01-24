import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from '@discordjs/builders';
import { CacheType, Collection, CommandInteraction } from 'discord.js';
import 'firebase/firestore';

import scheduler from 'node-schedule';
import fs from 'fs';
import path from 'path';

import { Command, CommandGroup, Permissions, SubCommand, SubCommandGroup } from './types';
import { Guild } from './models/guild';

/**
 * Given a filename and a directory, returns an iterator allowing module iteration
 * @param {string} filename The current filename triggering this function
 * @param {string} directory The directory to traverse on. This directory should be in the same parent directory of the current file
 */
export function* directoryFiles<T>(filename: string, directory: string) {
    const files = fs.readdirSync(`${path.dirname(filename)}${path.sep}${directory}`).filter(file => file.endsWith(path.extname(filename)));

    for (const file of files) {
        yield require(`${path.dirname(filename)}${path.sep}${directory}${path.sep}${file}`) as T;
    }
}

/**
 * A handy utility to easily define commands 
 * @param name The name of this command
 * @param description The description of this command
 * @returns A well-defined object associated with this command type
 */
export function createCommand(name: string, description: string, permission: Permissions,
    subcommandBuilderCallback: (builder: SlashCommandBuilder) => SlashCommandBuilder,
    interactionCallback: (interaction: CommandInteraction<CacheType>) => Promise<any>): Command {
    return {
        data: subcommandBuilderCallback(new SlashCommandBuilder()
            .setName(name)
            .setDescription(description)),
        permission: permission,
        execute: interactionCallback
    };
}

/**
 * A handy utility to easily define command groups 
 * @param name The name of this command group
 * @param description The description of this command group
 * @param filename The filename of the function caller. This is to automate subcommand handling
 * @param interactionCallback A callback when this command group is executed (Subcommand handling is done after this callback)
 * @returns A well-defined object associated with this command type, with an empty `subcommands` collection
 */
export function createCommandGroup(name: string, description: string, permission: Permissions, filename: string, interactionCallback: (interaction: CommandInteraction<CacheType>) => Promise<any> = (_) => Promise.resolve()): CommandGroup {
    const command = {
        data: new SlashCommandBuilder()
            .setName(name)
            .setDescription(description),
        permission: permission,
        subcommands: new Collection<string, SubCommandGroup | SubCommand>(),
        execute: async (interaction: CommandInteraction<CacheType>) => {
            interactionCallback(interaction);

            const options = interaction.options.data;

            if (options[0].type === 'SUB_COMMAND')
                command.subcommands.get(interaction.options.getSubcommand() as string)?.execute(interaction);
            else if (options[0].type === 'SUB_COMMAND_GROUP')
                command.subcommands.get(interaction.options.getSubcommandGroup() as string)?.execute(interaction);
            else
                await interaction.reply({ content: 'It seems that you\'ve entered an invalid command.\n Please try again.', ephemeral: true });
        }
    };

    for (const subcommand of directoryFiles<SubCommandGroup | SubCommand>(filename, name)) {
        subcommand.bindTo(command);
        command.subcommands?.set(subcommand.data.name, subcommand);
    }

    return command;
}

/**
 * A handy utility to easily define subcommand groups 
 * @param name The name of this subcommand group
 * @param description The description of this subcommand group
 * @param filename The filename of the function caller. This is to automate subcommand handling
 * @param interactionCallback A callback when this command group is executed (Subcommand handling has been handled)
 * @returns A well-defined object associated with this command type
 */
export function createSubCommandGroup(name: string, description: string, filename: string, interactionCallback: (interaction: CommandInteraction<CacheType>) => Promise<any> = (_) => Promise.resolve()): SubCommandGroup {
    const command = {
        data: new SlashCommandSubcommandGroupBuilder()
            .setName(name)
            .setDescription(description),
        bindTo: (parentCommand: CommandGroup) => {
            parentCommand.data.addSubcommandGroup(command.data);
        },
        subcommands: new Collection<string, SubCommand>(),
        execute: async (interaction: CommandInteraction<CacheType>) => {
            interactionCallback(interaction);

            const subcommand = interaction.options.getSubcommand();

            if (!subcommand)
                await interaction.reply({ content: 'It seems that you\'ve entered an invalid command.\n Please try again.', ephemeral: true });
            else
                command.subcommands.get(subcommand)?.execute(interaction);
        }
    };

    for (const subcommand of directoryFiles<SubCommand>(filename, name)) {
        subcommand.bindTo(command);
        command.subcommands?.set(subcommand.data.name, subcommand);
    }

    return command;

}

/**
 * A handy utility to easily define subcommands
 * @param name The name of this subcommand
 * @param description The description of this subcommand
 * @param interactionCallback A callback when this subcommand is executed
 * @returns A well-defined object associated with this command type
 */
export function createSubCommand(name: string, description: string,
    subcommandBuilderCallback: (builder: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder,
    interactionCallback: (interaction: CommandInteraction<CacheType>) => Promise<any>): SubCommand {
    const command = {
        data: subcommandBuilderCallback(new SlashCommandSubcommandBuilder()
            .setName(name)
            .setDescription(description)),
        bindTo: (parentCommand: CommandGroup | SubCommandGroup) => {
            parentCommand.data.addSubcommand(command.data);
        },
        execute: interactionCallback
    };
    return command;
}

export function unimplementedCommandCallback() {
    return async (interaction: CommandInteraction<CacheType>) => {
        await interaction.reply({ content: `Unfortunately, this command hasn't been implemented yet. Come back later!`, ephemeral: true });
    }
}