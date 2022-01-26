import { fileURLToPath } from 'url';

import { Permissions } from '../types.js';
import { createCommandGroup } from '../utilities.js';

const command =
    await createCommandGroup('apply', 'Application related commands', Permissions.VERIFIED, fileURLToPath(import.meta.url));

export default command;