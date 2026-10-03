const { execSync } = require('node:child_process');
const { Client } = require('pg');

module.exports = async () => {
  const host = process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== 'memory' ? process.env.POSTGRES_HOST : '127.0.0.1';
  const port = Number(process.env.POSTGRES_PORT ?? 5434);
  const user = process.env.POSTGRES_USER ?? 'indexer';
  const password = process.env.POSTGRES_PASSWORD ?? 'indexer';
  const admin = new Client({ host, port, user, password, database: 'indexer' });
  await admin.connect();
  const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'indexer_test'");
  if (existing.rowCount === 0) {
    await admin.query('CREATE DATABASE indexer_test');
  }
  await admin.end();

  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/indexer_test`;
  execSync('npx prisma migrate deploy', {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
};
