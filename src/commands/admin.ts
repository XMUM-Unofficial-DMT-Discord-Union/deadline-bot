import { fileURLToPath } from 'url';
import { Permissions } from '../types.js';
import { createCommandGroup } from '../utilities.js';

const command =
    await createCommandGroup('admin', 'Admin related commands', Permissions.ADMIN, fileURLToPath(import.meta.url));

export default command;