import { hashAdminPassword } from './admin-auth.service.js';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run admin:hash-password -- <password>');
  process.exit(1);
}

console.log(await hashAdminPassword(password));
