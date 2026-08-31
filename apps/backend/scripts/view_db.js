/**
 * InfraOps360 - Database Inspection Utility Script
 * Run with: node scripts/view_db.js
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infraops360'
});

async function viewDatabase() {
  console.log('--- INFRAOPS360 DATABASE CONTENTS ---\n');
  try {
    const tenants = await pool.query('SELECT * FROM tenants');
    console.log(`🏢 TENANTS (${tenants.rows.length}):`);
    console.table(tenants.rows);
    console.log('\n');

    const admins = await pool.query('SELECT * FROM tenant_admins');
    console.log(`👤 TENANT ADMINS (${admins.rows.length}):`);
    console.table(admins.rows);
    console.log('\n');

    const drafts = await pool.query('SELECT * FROM tenant_drafts');
    console.log(`📝 TENANT DRAFTS (${drafts.rows.length}):`);
    console.table(drafts.rows.map(d => ({ ...d, draft_data: JSON.parse(d.draft_data) })));
    console.log('\n');

  } catch (err) {
    console.error('Error fetching database contents:', err);
  } finally {
    await pool.end();
  }
}

viewDatabase();
