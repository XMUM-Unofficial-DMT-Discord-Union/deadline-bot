import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { CacheType, Collection, CommandInteraction } from "discord.js";

// Defines the structure of each command
export interface ICommand {
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder,
    subcommands?: Collection<string, ISubCommand>,
    execute(interaction: CommandInteraction<CacheType>): Promise<any>
}

// Defines the structure of each command
export interface ISubCommand {
    data: SlashCommandSubcommandBuilder,
    execute(interaction: CommandInteraction<CacheType>): Promise<any>
}

// Defines the structure of each event
export interface IEvent {
    once: boolean,
    name: string,
    execute(...args: any[]): any
}