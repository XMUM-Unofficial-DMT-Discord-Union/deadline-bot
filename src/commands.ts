import { Collection, Interaction } from 'discord.js';
import { fileURLToPath } from 'url';

import { Command, CommandGroup, ModalHandlerType, Permissions } from './types.js';
import { directoryFiles } from './utilities.js';

const BOT_COMMANDS = new Collection<string, Command | CommandGroup>();
const CUSTOM_ID_HANDLERS = new Collection<string, ModalHandlerType>();

for (const commandPromise of directoryFiles<Command | CommandGroup>(fileURLToPath(import.meta.url), 'commands')) {

    const command = (await commandPromise).default;

    if (command.permission === Permissions.NOTVERIFIED)
        command.data.setDefaultPermission(true);
    else
        command.data.setDefaultMemberPermissions('0');

    // Discord.js v14: Commands are by default visible in DMs
    command.data.setDMPermission(false);

    BOT_COMMANDS.set(command.data.name, command);

    if (command.customIdHandler !== undefined)
        CUSTOM_ID_HANDLERS.set(command.modalId as string, command.customIdHandler);
}

export default { BOT_COMMANDS, MODAL_HANDLERS: CUSTOM_ID_HANDLERS };