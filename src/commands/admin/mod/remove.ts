import { createSubCommand, unimplementedCommandCallback } from "../../../utilities";

const command = createSubCommand('remove', 'Removes a moderator', (_) => _, unimplementedCommandCallback())

module.exports = command