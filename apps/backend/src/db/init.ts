import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infraops360'
});

const createTables = async () => {
  console.log('Initializing PostgreSQL database...');

  try {
    // 1. Create Subscription Plans Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price_monthly DECIMAL DEFAULT 0,
        included_tonnage INTEGER DEFAULT 0,
        included_equipment INTEGER DEFAULT 0,
        additional_tonnage_price DECIMAL DEFAULT 0,
        additional_equipment_price DECIMAL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Subscription Plans table created/verified');

    // 2. Insert Default Subscription Plans
    console.log('Seeding default subscription plans...');
    const plansCountResult = await pool.query('SELECT COUNT(*) as count FROM subscription_plans');
    const count = parseInt(plansCountResult.rows[0].count, 10);

    if (count === 0) {
      const insertQuery = `
        INSERT INTO subscription_plans 
        (name, description, price_monthly, included_tonnage, included_equipment, additional_tonnage_price, additional_equipment_price) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(insertQuery, ['Starter', 'Includes 2,500 Free Tons & 5 Included Equipment', 2999, 2500, 5, 0.50, 500]);
      await pool.query(insertQuery, ['Professional', 'Includes 25,000 Free Tons & 20 Included Equipment', 9999, 25000, 20, 0.50, 500]);
      await pool.query(insertQuery, ['Enterprise', 'Includes 100,000 Free Tons & 50 Included Equipment', 24999, 100000, 50, 0.50, 500]);
      await pool.query(insertQuery, ['Corporate', 'Includes 500,000 Free Tons & 100 Included Equipment', 49999, 500000, 100, 0.50, 500]);
    }

    // Create Tenants Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        industry_type VARCHAR(255),
        country VARCHAR(255),
        state VARCHAR(255),
        pincode VARCHAR(50),
        city VARCHAR(255),
        company_website VARCHAR(255),
        company_size VARCHAR(50),
        company_code VARCHAR(50),
        company_address TEXT,
        gst_number VARCHAR(100),
        pan_number VARCHAR(100),
        msme_number VARCHAR(100),
        subscription_plan_id INTEGER REFERENCES subscription_plans(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tenants table created/verified');

    // Create Tenant Admins Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_admins (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        firebase_uid VARCHAR(255) UNIQUE,
        admin_name VARCHAR(255) NOT NULL,
        designation VARCHAR(255),
        mobile VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tenant Admins table created/verified');

    // Create Tenant Drafts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_drafts (
        firebase_uid VARCHAR(255) PRIMARY KEY,
        draft_data TEXT NOT NULL,
        step INTEGER NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tenant Drafts table created/verified');

    // Create Team Members Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Team Members table created/verified');

    // Create Tenant Projects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_projects (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL UNIQUE,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        location_block VARCHAR(255),
        customer VARCHAR(255),
        commodity VARCHAR(255),
        contract_quantity VARCHAR(100),
        contract_quantity_unit VARCHAR(100),
        contract_start_date VARCHAR(50),
        contract_end_date VARCHAR(50),
        other_data TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tenant Projects table created/verified');

    // 6. Create Form Fields Config Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_fields_config (
        id SERIAL PRIMARY KEY,
        form_type VARCHAR(50) NOT NULL,
        field_key VARCHAR(100) NOT NULL,
        field_label VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) DEFAULT 'text',
        is_default BOOLEAN DEFAULT false,
        is_hidden BOOLEAN DEFAULT false,
        is_required BOOLEAN DEFAULT false,
        dropdown_options TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_form_field UNIQUE (form_type, field_key)
      );
    `);
    console.log('✅ Form Fields Config table created/verified');

    const configCountRes = await pool.query('SELECT COUNT(*) as count FROM form_fields_config');
    if (parseInt(configCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding default form field configs...');
      const insertField = `
        INSERT INTO form_fields_config (form_type, field_key, field_label, field_type, is_default, is_required)
        VALUES ($1, $2, $3, $4, true, $5)
      `;
      // Registration Defaults
      const regFields = [
        ['companyName', 'Company Name', 'text', true],
        ['industryType', 'Industry Type', 'text', false],
        ['country', 'Country', 'text', true],
        ['state', 'State', 'text', true],
        ['city', 'City', 'text', true],
        ['pincode', 'Pincode', 'text', false],
        ['companyWebsite', 'Company Website', 'text', false],
        ['companySize', 'Company Size', 'text', false],
        ['companyAddress', 'Company Address', 'text', false],
        ['gstNumber', 'GST Number', 'text', false],
        ['panNumber', 'PAN Number', 'text', false],
        ['msmeNumber', 'MSME Number', 'text', false],
        ['adminName', 'Admin Name', 'text', true],
        ['designation', 'Designation', 'text', false],
        ['mobile', 'Mobile Number', 'text', true],
        ['email', 'Email Address', 'text', true],
        ['subdomain', 'Subdomain', 'text', true],
      ];
      for (const f of regFields) {
        await pool.query(insertField, ['registration', f[0], f[1], f[2], f[3]]);
      }

      // Project Defaults
      const projFields = [
        ['name', 'Project Name', 'text', true],
        ['location', 'Project Location', 'text', true],
        ['locationBlock', 'Location Block / Phase', 'text', false],
        ['customer', 'Client / Customer', 'text', false],
        ['commodity', 'Cargo / Commodity', 'text', false],
        ['contractQuantity', 'Quantity', 'text', false],
        ['contractQuantityUnit', 'Quantity Unit', 'text', false],
        ['contractStartDate', 'Start Date', 'text', false],
        ['contractEndDate', 'End Date', 'text', false],
        ['otherData', 'Remarks / Other Data', 'text', false],
      ];
      for (const f of projFields) {
        await pool.query(insertField, ['project', f[0], f[1], f[2], f[3]]);
      }

      // Worksite Defaults
      const siteFields = [
        ['name', 'Work Site Name', 'text', true],
        ['location', 'Location Address', 'text', true],
        ['type', 'Worksite Type', 'text', true],
        ['supervisor', 'Supervisor Name', 'text', true],
        ['contact', 'Contact Number', 'text', true],
      ];
      for (const f of siteFields) {
        await pool.query(insertField, ['worksite', f[0], f[1], f[2], f[3]]);
      }
      console.log('✅ Default form field configs seeded');
    }

    await pool.end();
    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    await pool.end();
  }
};
createTables();