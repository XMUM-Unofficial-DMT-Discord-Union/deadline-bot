import { CacheType, Collection, ModalSubmitInteraction, MessageComponentInteraction, ChatInputCommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } from "discord.js";

export type ModalHandlerType = (modal: ModalSubmitInteraction<CacheType> | MessageComponentInteraction<CacheType>, partitionId: string) => Promise<any>;

export type HandledInteractions = ChatInputCommandInteraction | AutocompleteInteraction;

// Defines the structure of each command
export type Command = {
    data: SlashCommandBuilder;
    permission?: Permissions;
    execute(interaction: HandledInteractions): Promise<any>;
    modalId?: string;
    customIdHandler?: ModalHandlerType;
};

// Defines a group of Subcommands branching from a single Command
export type CommandGroup = Command & {
    subcommands: Collection<string, SubCommandGroup | SubCommand>;
    subHandlers: Collection<string, ModalHandlerType>;
};

// Defines a group of (sub)commands
export type SubCommandGroup = {
    data: SlashCommandSubcommandGroupBuilder;
    permission?: Permissions;
    bindTo(command: CommandGroup): void;
    subcommands: Collection<string, SubCommand>;
    subHandlers: Collection<string, ModalHandlerType>;
    execute(interaction: HandledInteractions): Promise<any>;
    customIdHandler?: ModalHandlerType;
};

// Defines the structure of each Subcommand
export type SubCommand = {
    data: SlashCommandSubcommandBuilder;
    permission?: Permissions;
    bindTo(command: CommandGroup | SubCommandGroup): void;
    execute(interaction: HandledInteractions): Promise<any>;
    customIdHandler?: ModalHandlerType;
};

// Defines the structure of each event
export type Event = {
    once: boolean;
    name: string;
    execute(...args: any[]): any;
};

export enum Permissions {
    DEV = 'dev',
    ADMIN = 'admin',
    MOD = 'mod',
    VERIFIED = 'everyone',
    NOTVERIFIED = 'notverified'
}