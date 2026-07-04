import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.CRDB_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err.message)
})

export default pool
export const query = (text: string, values?: any[]) => pool.query(text, values)
