import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { CacheType, Collection, ModalSubmitInteraction, Interaction } from "discord.js";

export type ModalHandlerType = (modal: ModalSubmitInteraction<CacheType>, partitionId: string) => Promise<any>;

export type HandledInteractions<T extends Interaction> = T extends ModalSubmitInteraction ? never : Omit<T, 'isModalSubmit'>;

// Defines the structure of each command
export type Command<T extends Interaction> = {
    data: SlashCommandBuilder;
    permission?: Permissions;
    execute(interaction: HandledInteractions<T>): Promise<any>;
    modalId?: string;
    modalHandler?: ModalHandlerType;
};

// Defines a group of Subcommands branching from a single Command
export type CommandGroup<T extends Interaction> = Command<T> & {
    subcommands: Collection<string, SubCommandGroup<T> | SubCommand<T>>;
    subHandlers: Collection<string, ModalHandlerType>;
};

// Defines a group of (sub)commands
export type SubCommandGroup<T extends Interaction> = {
    data: SlashCommandSubcommandGroupBuilder;
    permission?: Permissions;
    bindTo(command: CommandGroup<T>): void;
    subcommands: Collection<string, SubCommand<T>>;
    subHandlers: Collection<string, ModalHandlerType>;
    execute<T extends Interaction>(interaction: HandledInteractions<T>): Promise<any>;
    modalHandler?: ModalHandlerType;
};

// Defines the structure of each Subcommand
export type SubCommand<T extends Interaction> = {
    data: SlashCommandSubcommandBuilder;
    permission?: Permissions;
    bindTo(command: CommandGroup<T> | SubCommandGroup<T>): void;
    execute<T extends Interaction>(interaction: HandledInteractions<T>): Promise<any>;
    modalHandler?: ModalHandlerType;
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