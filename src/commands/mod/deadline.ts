import { fileURLToPath } from 'url';

import { createSubCommandGroup } from '../../utilities.js';

const command = await createSubCommandGroup('deadline', 'Kicks a member', fileURLToPath(import.meta.url));

export default command;