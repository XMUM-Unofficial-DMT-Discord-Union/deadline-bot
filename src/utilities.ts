import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from '@discordjs/builders';
import Prisma from '@prisma/client';
import { ApplicationCommandOptionType, CacheType, Collection, ChatInputCommandInteraction, ModalSubmitInteraction, Interaction, InteractionType, MessageComponentInteraction, CommandInteraction } from 'discord.js';

import fs from 'fs';
import path from 'path';
import { Guild } from './models/guild.js';

import { Command, CommandGroup, HandledInteractions, ModalHandlerType, Permissions, SubCommand, SubCommandGroup } from './types.js';

/**
 * Given a filename and a directory, returns an iterator allowing module iteration
 * @param {string} filename The current filename triggering this function
 * @param {string} directory The directory to traverse on. This directory should be in the same parent directory of the current file
 */
export function* directoryFiles<T>(filename: string, directory: string) {
    const files = fs.readdirSync(`${path.dirname(filename)}${path.sep}${directory}`).filter(file => file.endsWith(path.extname(filename)));

    for (const file of files) {
        yield import(`${path.dirname(filename)}${path.sep}${directory}${path.sep}${file}`) as Promise<{ default: T; }>;
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
    interactionCallback: (interaction: HandledInteractions) => Promise<any>,
    modalHandler?: (modal: ModalSubmitInteraction) => Promise<any>,
    messageComponentHandler?: (componentInteraction: MessageComponentInteraction) => Promise<any>): Command {
    let command = {
        data: subcommandBuilderCallback(new SlashCommandBuilder()
            .setName(name)
            .setDescription(description)),
        permission: permission,
        execute: interactionCallback,
        modalId: name
    };

    if (modalHandler !== undefined || messageComponentHandler !== undefined)
        Object.defineProperty(command, "modalHandler",
            {
                value: async (interaction: ModalSubmitInteraction | MessageComponentInteraction, _: string) => {
                    if (interaction.isModalSubmit()) {
                        if (modalHandler === undefined)
                            throw `Command name \`${name}\` does not have a modal handler.`;
                        return modalHandler(interaction);
                    }

                    if (messageComponentHandler === undefined)
                        throw 'Command name \`${name}\` does not have a message component handler.`';
                    return messageComponentHandler(interaction);
                },
                writable: true
            });

    return command;
}

/**
 * A handy utility to easily define command groups 
 * @param name The name of this command group
 * @param description The description of this command group
 * @param filename The filename of the function caller. This is to automate subcommand handling
 * @param interactionCallback A callback when this command group is executed (Subcommand handling is done after this callback)
 * @returns A well-defined object associated with this command type, with an empty `subcommands` collection
 */
export async function createCommandGroup(name: string, description: string, permission: Permissions, filename: string): Promise<CommandGroup> {
    let command = {
        data: new SlashCommandBuilder()
            .setName(name)
            .setDescription(description),
        permission: permission,
        subcommands: new Collection<string, SubCommandGroup | SubCommand>(),
        subHandlers: new Collection<string, ModalHandlerType>(),
        execute: async (interaction: HandledInteractions) => {

            const options = interaction.options.data;

            if (options[0].type === ApplicationCommandOptionType.Subcommand)
                command.subcommands.get(interaction.options.getSubcommand() as string)?.execute(interaction);
            else if (options[0].type === ApplicationCommandOptionType.SubcommandGroup)
                command.subcommands.get(interaction.options.getSubcommandGroup() as string)?.execute(interaction);
            else
                await (interaction as ChatInputCommandInteraction).reply({ content: 'It seems that you\'ve entered an invalid command.\n Please try again.', ephemeral: true });
        },
        modalId: name
    };

    for (const subcommandPromise of directoryFiles<SubCommandGroup | SubCommand>(filename, name)) {
        const subcommand = (await subcommandPromise).default;
        subcommand.bindTo(command);
        command.subcommands?.set(subcommand.data.name, subcommand);
    }

    Object.defineProperty(command, "modalHandler",
        {
            value: async (modal: ModalSubmitInteraction, partitionId: string) => {

                let categorySeparatorIndex = partitionId.indexOf(' ');
                let nextHandlerId = partitionId.substring(0, categorySeparatorIndex === -1 ? undefined : categorySeparatorIndex);
                let subPartitionId = categorySeparatorIndex === -1 ? partitionId : partitionId.substring(categorySeparatorIndex + 1);

                if (categorySeparatorIndex === -1)
                    throw `In Command Group '${name}'. The modal with id '${partitionId}' does not have an appropriate handler.`;

                let handler = command.subcommands.get(nextHandlerId);

                if (handler === undefined || handler.modalHandler === undefined)
                    throw `In Command Group '${name}'. The modal with id '${partitionId}' does not match with any subcommands/subcommand groups within the group.`;

                // It's now confirmed that there's a subcommand handler
                await handler.modalHandler(modal, subPartitionId);
            },
            writable: true
        });

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
export async function createSubCommandGroup(name: string, description: string, filename: string): Promise<SubCommandGroup> {
    let command = {
        data: new SlashCommandSubcommandGroupBuilder()
            .setName(name)
            .setDescription(description),
        bindTo: (parentCommand: CommandGroup) => {
            parentCommand.data.addSubcommandGroup(command.data);
        },
        subcommands: new Collection<string, SubCommand>(),
        subHandlers: new Collection<string, ModalHandlerType>(),
        execute: async (interaction: HandledInteractions) => {

            const subcommand = interaction.options.getSubcommand();

            if (!subcommand)
                await (interaction as ChatInputCommandInteraction).reply({ content: 'It seems that you\'ve entered an invalid command.\n Please try again.', ephemeral: true });
            else
                command.subcommands.get(subcommand)?.execute(interaction);
        },
    };

    for (const subcommandPromise of directoryFiles<SubCommand>(filename, name)) {
        const subcommand = (await subcommandPromise).default;
        subcommand.bindTo(command);
        command.subcommands?.set(subcommand.data.name, subcommand);
    }

    Object.defineProperty(command, "modalHandler",
        {
            value: async (modal: ModalSubmitInteraction, partitionId: string) => {
                let categorySeparatorIndex = partitionId.indexOf(' ');
                let nextHandlerId = partitionId.substring(0, categorySeparatorIndex === -1 ? undefined : categorySeparatorIndex);
                let subPartitionId = categorySeparatorIndex === -1 ? partitionId : partitionId.substring(categorySeparatorIndex + 1);

                if (categorySeparatorIndex !== -1)
                    throw `In Subcommand Group '${name}'. The modal with id '${partitionId}' has whitespaces.`;

                let handler = command.subcommands.get(nextHandlerId);

                if (handler === undefined || handler.modalHandler === undefined)
                    throw `In Subcommand Group '${name}'. The modal with id '${partitionId}' does not match with any subcommands within the group.`;

                // It's now confirmed that there's a subcommand handler
                await handler.modalHandler(modal, subPartitionId);
            },
            writable: true
        });

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
    interactionCallback: (interaction: HandledInteractions) => Promise<any>,
    modalHandler?: (modal: ModalSubmitInteraction) => Promise<any>,
    messageComponentHandler?: (componentInteraction: MessageComponentInteraction) => Promise<any>): SubCommand {
    const command = {
        data: subcommandBuilderCallback(new SlashCommandSubcommandBuilder()
            .setName(name)
            .setDescription(description)),
        bindTo: (parentCommand: CommandGroup | SubCommandGroup) => {
            parentCommand.data.addSubcommand(command.data);
        },
        execute: interactionCallback,
    };

    if (modalHandler !== undefined || messageComponentHandler !== undefined)
        Object.defineProperty(command, "modalHandler",
            {
                value: async (interaction: ModalSubmitInteraction | MessageComponentInteraction, _: string) => {
                    if (interaction.isModalSubmit()) {
                        if (modalHandler === undefined)
                            throw `Command name \`${name}\` does not have a modal handler.`;
                        return modalHandler(interaction);
                    }

                    if (messageComponentHandler === undefined)
                        throw 'Command name \`${name}\` does not have a message component handler.`';
                    return messageComponentHandler(interaction);
                },
                writable: true
            });

    return command;
}

export function unimplementedCommandCallback() {
    return async (interaction: HandledInteractions) => {
        await (interaction as ChatInputCommandInteraction).reply({ content: `Unfortunately, this command hasn't been implemented yet. Come back on the next bot update!`, ephemeral: true });
    };
}

export const GUILD = await Guild.getInstance();

export const prisma = (() => {
    const prisma = new Prisma.PrismaClient();

    return prisma;
})();