import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Centralized MySQL connection pool using mysql2/promise.
 * Connects to XAMPP MySQL database (e.g. hrims / hrims_db).
 */

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrims',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
};

export const pool: Pool = global.__mysqlPool || mysql.createPool(dbConfig);

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = pool;
}

/**
 * Execute a parameterized SELECT query
 */
export async function query<T = RowDataPacket[]>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Execute an INSERT / UPDATE / DELETE parameterized statement
 */
export async function execute(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as ResultSetHeader;
}

/**
 * Check MySQL connection liveness
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const [rows] = await pool.query('SELECT 1 as is_alive');
    if (Array.isArray(rows) && rows.length > 0) {
      return { connected: true, message: 'MySQL connection established successfully.' };
    }
    return { connected: false, message: 'Unexpected ping response from database.' };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      connected: false,
      message: `Failed to connect to MySQL database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}: ${error.message}`,
    };
  }
}
