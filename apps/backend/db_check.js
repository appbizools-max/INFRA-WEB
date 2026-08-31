const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/infraops360'
});

async function check() {
  try {
    const admins = await pool.query('SELECT * FROM tenant_admins');
    console.log('Admins count:', admins.rows.length);
    console.log('Admins list:', admins.rows.map(r => ({ id: r.id, tenant_id: r.tenant_id, firebase_uid: r.firebase_uid, email: r.email })));

    const tenants = await pool.query('SELECT * FROM tenants');
    console.log('Tenants count:', tenants.rows.length);
    console.log('Tenants list:', tenants.rows.map(r => ({ id: r.id, company_name: r.company_name, subdomain: r.subdomain, payment_status: r.payment_status, subscription_plan_id: r.subscription_plan_id })));
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
