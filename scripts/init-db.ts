/**
 * Database initializer for fresh clones.
 *
 * Applies database/schema.sql (creates the database, tables, and portfolio view)
 * using the credentials from .env, then optionally loads database/seed.sql.
 *
 * Usage:
 *   pnpm db:init          # create schema only
 *   pnpm db:init --seed   # create schema and load demo data (database/seed.sql)
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

dotenv.config();

function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
  }
  throw new Error('Set DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD in .env first.');
}

async function main() {
  const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');

  // Strip comment lines, then split into individual statements.
  const statements = raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const conn = await mysql.createConnection(getConnectionConfig());
  try {
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log(`Schema applied (${statements.length} statements) from database/schema.sql`);
  } finally {
    await conn.end();
  }

  if (process.argv.includes('--seed')) {
    const seedPath = path.resolve(process.cwd(), 'database', 'seed.sql');
    const seedRaw = fs.readFileSync(seedPath, 'utf8');
    const seedStatements = seedRaw
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const seedConn = await mysql.createConnection(getConnectionConfig());
    try {
      for (const stmt of seedStatements) {
        await seedConn.query(stmt);
      }
      console.log(`Seed data applied (${seedStatements.length} statements) from database/seed.sql`);
    } finally {
      await seedConn.end();
    }
  } else {
    console.log('Done. Start the server with `pnpm dev`, then sign up — the first user becomes admin.');
    console.log('Tip: run `pnpm db:init --seed` to also load demo data from database/seed.sql.');
  }
}

main().catch((err) => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});
