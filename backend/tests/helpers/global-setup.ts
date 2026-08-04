import { execSync } from 'node:child_process';
import path from 'node:path';

import './load-test-env';

const backendRoot = path.join(__dirname, '..', '..');

export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', { cwd: backendRoot, stdio: 'inherit', env: process.env });
  execSync('npx tsx prisma/seed.ts --force', { cwd: backendRoot, stdio: 'inherit', env: process.env });
}
