import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { CacheType, Collection, CommandInteraction } from "discord.js";

// Defines the structure of each command
export type Command = {
    data: SlashCommandBuilder,
    permission?: Permissions,
    execute(interaction: CommandInteraction<CacheType>): Promise<any>
}

// Defines a group of Subcommands branching from a single Command
export type CommandGroup = Command & {
    subcommands: Collection<string, SubCommandGroup | SubCommand>
}

// Defines a group of (sub)commands
export type SubCommandGroup = {
    data: SlashCommandSubcommandGroupBuilder,
    permission?: Permissions,
    bindTo(command: CommandGroup): void,
    subcommands: Collection<string, SubCommand>,
    execute(interaction: CommandInteraction<CacheType>): Promise<any>
}

// Defines the structure of each Subcommand
export type SubCommand = {
    data: SlashCommandSubcommandBuilder,
    permission?: Permissions,
    bindTo(command: CommandGroup | SubCommandGroup): void,
    execute(interaction: CommandInteraction<CacheType>): Promise<any>
}

// Defines the structure of each event
export type Event = {
    once: boolean,
    name: string,
    execute(...args: any[]): any
}

export enum Permissions {
    ADMIN = 'admin',
    MOD = 'mod',
    EVERYONE = 'everyone'
}