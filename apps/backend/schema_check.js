const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/infraops360'
});

async function check() {
  try {
    const tenantsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants';
    `);
    console.log('tenants columns:', tenantsCols.rows);

    const plansCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans';
    `);
    console.log('subscription_plans columns:', plansCols.rows);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
