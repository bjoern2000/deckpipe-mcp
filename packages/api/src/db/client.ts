import pg from 'pg';
import { config } from '../config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export function getPool() {
  return pool;
}
