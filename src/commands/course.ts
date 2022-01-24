import { fileURLToPath } from "url";

import { Permissions } from "../types.js";
import { createCommandGroup } from "../utilities.js";

const command =
    await createCommandGroup('course', 'Course related commands.', Permissions.EVERYONE, fileURLToPath(import.meta.url));

export default command;