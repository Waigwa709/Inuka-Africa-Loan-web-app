import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration comes from a single source of truth:
// either DATABASE_URL (mysql://user:pass@host:port/db) or discrete DB_* vars.
// No credentials are hardcoded in source control.
const hasUrl = !!process.env.DATABASE_URL;
const hasDiscrete = !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME);

if (!hasUrl && !hasDiscrete) {
  throw new Error(
    'Database configuration missing. Set DATABASE_URL (mysql://user:pass@host:port/db) ' +
      'or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME environment variables. See .env.example.'
  );
}

const pool = hasUrl
  ? mysql.createPool(process.env.DATABASE_URL as string)
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      user: process.env.DB_USER as string,
      password: process.env.DB_PASSWORD as string,
      database: process.env.DB_NAME as string,
    });

export default pool;
