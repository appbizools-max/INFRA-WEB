require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  const tenantId = 1; // test tenant
  
  const queries = [
    {
      name: "Bank Accounts Sum",
      sql: "SELECT COALESCE(SUM(current_balance), 0) as total FROM tenant_bank_cash_accounts WHERE tenant_id = $1"
    },
    {
      name: "Petty Cash Sum",
      sql: "SELECT COALESCE(SUM(current_balance), 0) as total FROM tenant_petty_cash_floats WHERE tenant_id = $1"
    },
    {
      name: "Client Outstanding",
      sql: "SELECT COALESCE(SUM(CASE WHEN type IN ('Invoice', 'Opening Balance') THEN amount ELSE -amount END), 0) as total FROM tenant_client_ledger_entries WHERE tenant_id = $1 AND status <> 'Reversed'"
    },
    {
      name: "Vendor Outstanding",
      sql: "SELECT COALESCE(SUM(CASE WHEN type IN ('Bill', 'Opening Balance') THEN amount ELSE -amount END), 0) as total FROM tenant_vendor_ledger_entries WHERE tenant_id = $1 AND status <> 'Reversed'"
    },
    {
      name: "Employee Outstanding",
      sql: "SELECT COALESCE(SUM(CASE WHEN type IN ('Salary Advance', 'Petty Cash Advance') THEN amount ELSE -amount END), 0) as total FROM tenant_employee_ledger_entries WHERE tenant_id = $1 AND status <> 'Reversed'"
    },
    {
      name: "Bank Tx Activity Query",
      sql: `SELECT 'Bank/Cash' as entity, type, amount, date, reference_no as voucher_no, status, note, created_at 
            FROM tenant_bank_cash_entries e JOIN tenant_bank_cash_accounts a ON e.account_id = a.id 
            WHERE a.tenant_id = $1 ORDER BY date DESC, created_at DESC LIMIT 10`
    },
    {
      name: "Petty Tx Activity Query",
      sql: `SELECT 'Petty Cash' as entity, type, amount, date, voucher_no, status, note, e.created_at 
            FROM tenant_petty_cash_entries e JOIN tenant_petty_cash_floats f ON e.float_id = f.id 
            WHERE f.tenant_id = $1 ORDER BY date DESC, created_at DESC LIMIT 10`
    },
    {
      name: "Client Tx Activity Query",
      sql: `SELECT 'Client' as entity, type, amount, date, voucher_no, status, note, created_at 
            FROM tenant_client_ledger_entries WHERE tenant_id = $1 ORDER BY date DESC, created_at DESC LIMIT 10`
    },
    {
      name: "Vendor Tx Activity Query",
      sql: `SELECT 'Vendor' as entity, type, amount, date, voucher_no, status, note, created_at 
            FROM tenant_vendor_ledger_entries WHERE tenant_id = $1 ORDER BY date DESC, created_at DESC LIMIT 10`
    },
    {
      name: "Employee Tx Activity Query",
      sql: `SELECT 'Employee' as entity, type, amount, date, voucher_no, status, note, created_at 
            FROM tenant_employee_ledger_entries WHERE tenant_id = $1 ORDER BY date DESC, created_at DESC LIMIT 10`
    }
  ];

  for (const q of queries) {
    try {
      console.log(`Testing query: ${q.name}...`);
      await pool.query(q.sql, [tenantId]);
      console.log(`✅ ${q.name} passed.`);
    } catch (err) {
      console.error(`❌ ${q.name} failed! Error:`, err.message);
    }
  }
  
  await pool.end();
})();
