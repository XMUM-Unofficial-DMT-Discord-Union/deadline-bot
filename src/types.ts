import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, Interaction } from "discord.js";

// Defines the structure of each command
export interface ICommand {
    data: SlashCommandBuilder,
    execute(interaction: Interaction<CacheType>): Promise<any>
}

// Defines the structure of each event
export interface IEvent {
    once: boolean,
    name: string,
    execute(...args: any[]): any
}