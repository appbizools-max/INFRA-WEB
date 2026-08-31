const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/infraops360?sslmode=disable'
});

async function main() {
  try {
    const tenants = await pool.query('SELECT id, company_name, company_code FROM tenants');
    console.log('--- TENANTS ---');
    console.log(tenants.rows);

    const admins = await pool.query('SELECT id, admin_name, firebase_uid, tenant_id FROM tenant_admins');
    console.log('--- ADMINS ---');
    console.log(admins.rows);

    const users = await pool.query('SELECT id, name, role, email, mobile, status, member_id, firebase_uid, tenant_id FROM tenant_users');
    console.log('--- USERS ---');
    console.log(users.rows);

    const drafts = await pool.query('SELECT firebase_uid FROM tenant_drafts');
    console.log('--- DRAFTS ---');
    console.log(drafts.rows);

    const attendance = await pool.query('SELECT id, status FROM tenant_attendance_logs');
    console.log('--- ATTENDANCE LOGS ---');
    console.log(attendance.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
