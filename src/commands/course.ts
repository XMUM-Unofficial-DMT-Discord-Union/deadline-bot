import { Permissions } from "../types";
import { createCommandGroup } from "../utilities";

const command = createCommandGroup('course', 'Course related commands.', Permissions.EVERYONE, __filename);

module.exports = command;