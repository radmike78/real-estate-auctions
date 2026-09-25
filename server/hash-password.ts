// Prints an ADMIN_PASSWORD_HASH for the given password (read from stdin, not the command line,
// so it doesn't end up in shell history).
//   npm run -s admin:hash-password     then type the password and press Enter

import { createInterface } from 'node:readline';
import { hashPassword } from './auth';

const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: process.stdin.isTTY });
process.stderr.write('Admin password (12+ characters): ');
rl.once('line', (pw) => {
  rl.close();
  try {
    console.log(hashPassword(pw.trim()));
  } catch (e) {
    console.error(`\n${(e as Error).message}`);
    process.exit(1);
  }
});
