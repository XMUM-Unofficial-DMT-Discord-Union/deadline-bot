import { ApplicationCommandOptionChoice, AutocompleteInteraction } from 'discord.js';
import { createSubCommand, GUILD, unimplementedCommandCallback } from '../../utilities.js';

const command = createSubCommand('event', 'Suggest an event', _ => _, unimplementedCommandCallback());

export default command;