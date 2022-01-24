import { fileURLToPath } from 'url';

import { createSubCommandGroup } from '../../utilities.js';

const command =
    await createSubCommandGroup('apply', 'Application related commands.', fileURLToPath(import.meta.url));

export default command;