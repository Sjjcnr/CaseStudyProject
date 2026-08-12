const dotenv = require('dotenv');
const path = require('path');
const { spawn } = require('child_process');

// Load environment from root .env and backend .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Default local DATABASE_URL to SQLite dev.db if not explicitly set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node run-prisma.js <prisma-command>');
  process.exit(1);
}

const isWin = process.platform === 'win32';
const command = isWin ? 'npx.cmd' : 'npx';

const child = spawn(command, ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
