import { fileURLToPath } from 'url';

import { Permissions } from '../types.js';
import { createCommandGroup } from '../utilities.js';

const command =
    await createCommandGroup('bot', 'Bot related commands.', Permissions.VERIFIED, fileURLToPath(import.meta.url));

export default command;