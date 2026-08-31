require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    const admins = await pool.query('SELECT * FROM tenant_admins');
    console.log('--- ADMINS ---');
    console.log(admins.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
