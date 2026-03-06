import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool, PoolConfig } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "../shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Neon (serverless) or Railway/standard PostgreSQL
const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('neondb');

let pool: Pool | PgPool;
let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;

if (isNeon) {
  // Neon Serverless
  neonConfig.webSocketConstructor = ws;
  
  const connectionString = databaseUrl.includes('sslmode=')
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}sslmode=require`;
  
  pool = new Pool({ connectionString });
  db = drizzle({ client: pool as any, schema });
} else {
  // Railway or standard PostgreSQL
  const poolConfig: PoolConfig = {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  
  pool = new PgPool(poolConfig);
  db = drizzlePg({ client: pool as any, schema });
}

pool.on('error', (err) => {
  console.error('Unexpected database error on idle client', err);
});

export { pool, db };
