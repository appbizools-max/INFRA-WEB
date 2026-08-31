import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
async function clearProjects() {
  try {
    const res = await pool.query('DELETE FROM tenant_projects');
    console.log(`Deleted ${res.rowCount} projects from tenant_projects table.`);
  } catch (err) {
    console.error('Error deleting projects:', err);
  } finally {
    await pool.end();
  }
}
clearProjects();
