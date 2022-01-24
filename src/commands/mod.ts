import { fileURLToPath } from 'url';

import { Permissions } from '../types.js';
import { createCommandGroup } from '../utilities.js';

const command =
    await createCommandGroup('mod', 'Mod related commands', Permissions.MOD, fileURLToPath(import.meta.url));

export default command;