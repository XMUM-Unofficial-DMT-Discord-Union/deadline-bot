import { fileURLToPath } from 'url';

import { createSubCommandGroup } from '../../utilities.js';

const command =
    await createSubCommandGroup('verify', 'Verification related admin commands', fileURLToPath(import.meta.url));

export default command;