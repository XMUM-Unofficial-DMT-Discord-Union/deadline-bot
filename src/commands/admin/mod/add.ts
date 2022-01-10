import { createSubCommand, unimplementedCommandCallback } from "../../../utilities";

const command = createSubCommand('add', 'Adds a moderator', (_) => _, unimplementedCommandCallback())

module.exports = command