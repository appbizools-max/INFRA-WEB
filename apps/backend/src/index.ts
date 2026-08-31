import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import * as admin from 'firebase-admin';

import fs from 'fs';
import path from 'path';

dotenv.config();

// Initialize Firebase Admin (Requires GOOGLE_APPLICATION_CREDENTIALS or serviceAccountKey.json)
try {
  const localKeyPath = path.join(process.cwd(), 'serviceAccountKey.json');
  const fallbackKeyPath = path.join(__dirname, '../serviceAccountKey.json');
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                             (fs.existsSync(localKeyPath) ? localKeyPath : fallbackKeyPath);

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized with service account key.');
  } else {
    admin.initializeApp();
    console.log('⚠️ GOOGLE_APPLICATION_CREDENTIALS or serviceAccountKey.json not found. Custom token generation (Email Login) will fail unless running on GCP.');
  }
} catch (e: any) {
  console.log('Firebase Admin init skipped or failed:', e.message);
}

const app = express();
const port = process.env.PORT || 5000;

app.set('etag', false); // Disable ETag generation to ensure 200 OK responses

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Request logger middleware with timing & status formatting
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const method = req.method.padEnd(6);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status < 300 ? '🟢' : status < 400 ? '🟡' : '🔴';
    console.log(`${statusEmoji} [${timestamp}] ${method} ${status} ${req.originalUrl || req.url} (${duration}ms)`);
  });

  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infraops360'
});

// Basic in-memory OTP store for email verification
const emailOtpStore = new Map<string, { otp: string, expiresAt: number }>();

// In-memory OTP store for mobile verification (staff onboarding)
const mobileOtpStore = new Map<string, { otp: string, expiresAt: number }>();

// Auth Endpoints
app.post('/api/auth/check-user', async (req, res) => {
  const { email, mobile } = req.body;

  try {
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const adminCheck = await pool.query('SELECT id FROM tenant_admins WHERE LOWER(email) = $1', [cleanEmail]);
      const userCheck = await pool.query("SELECT id, status FROM tenant_users WHERE LOWER(email) = $1 AND COALESCE(status, 'Active') != 'Deactivated'", [cleanEmail]);
      return res.json({ exists: adminCheck.rows.length > 0 || userCheck.rows.length > 0 });
    }

    if (mobile) {
      const rawMobile = mobile.replace('+91', '').trim();
      const formattedMobile = `+91${rawMobile}`;

      const adminCheck = await pool.query(
        'SELECT id FROM tenant_admins WHERE mobile = $1 OR mobile = $2 OR mobile = $3',
        [mobile, rawMobile, formattedMobile]
      );

      const userCheck = await pool.query(
        "SELECT id, status FROM tenant_users WHERE (mobile = $1 OR mobile = $2 OR mobile = $3) AND COALESCE(status, 'Active') != 'Deactivated'",
        [mobile, rawMobile, formattedMobile]
      );

      return res.json({ exists: adminCheck.rows.length > 0 || userCheck.rows.length > 0 });
    }

    return res.status(400).json({ error: 'Provide email or mobile' });
  } catch (err) {
    console.error('Check user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const cleanEmail = email.trim().toLowerCase();
  const isTestEmail = cleanEmail.includes('test');
  const otp = isTestEmail ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

  // Store it (expires in 3 minutes)
  emailOtpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 3 * 60 * 1000 });

  console.log(`[EMAIL OTP] Sending to ${cleanEmail}: ${otp}`);

  if (!isTestEmail) {
    try {
      const resendApiKey = process.env.RESEND_API_KEY || '';
      const https = require('https');

      const postData = JSON.stringify({
        from: 'InfraOps 360 <onboarding@easyapps360.com>',
        to: [email],
        subject: 'Your InfraOps 360 Verification Code',
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <h1 style="color: #0f172a;">InfraOps 360</h1>
          <p style="color: #64748b; font-size: 16px;">Here is your secure verification code:</p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h2 style="font-size: 32px; letter-spacing: 8px; color: #10B981; margin: 0;">${otp}</h2>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 3 minutes.</p>
        </div>
      `
      });

      const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const reqOptions = https.request(options, (resObj: any) => {
        let body = '';
        resObj.on('data', (chunk: any) => body += chunk);
        resObj.on('end', () => {
          if (resObj.statusCode >= 200 && resObj.statusCode < 300) {
            console.log(`[EMAIL OTP] Successfully delivered via Resend API`);
          } else {
            console.error(`Resend API Error (Status ${resObj.statusCode}):`, body);
          }
        });
      });

      reqOptions.on('error', (e: any) => {
        console.error('Failed to send email via Resend API:', e);
      });

      reqOptions.write(postData);
      reqOptions.end();

    } catch (err) {
      console.error('Failed to execute Resend request:', err);
    }
  }

  res.json({ message: 'OTP sent successfully' });
});

app.post('/api/auth/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const cleanEmail = email.trim().toLowerCase();
  const isTestEmail = cleanEmail.includes('test');
  const isTestOtp = otp === '123456';

  let record = emailOtpStore.get(cleanEmail);

  // Fallback for test accounts/OTPs to survive development watcher server restarts
  if (!record && (isTestEmail || isTestOtp)) {
    record = { otp: '123456', expiresAt: Date.now() + 10 * 60 * 1000 };
  }

  if (!record) return res.status(400).json({ error: 'No OTP requested for this email' });

  if (Date.now() > record.expiresAt) {
    emailOtpStore.delete(cleanEmail);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (record.otp === otp) {
    emailOtpStore.delete(cleanEmail);

    try {
      // 1. Find the user's Firebase UID in the database
      let firebaseUid = null;
      const adminCheck = await pool.query('SELECT firebase_uid FROM tenant_admins WHERE LOWER(email) = $1', [cleanEmail]);
      if (adminCheck.rows.length > 0) {
        firebaseUid = adminCheck.rows[0].firebase_uid;
      } else {
        const userCheck = await pool.query('SELECT firebase_uid FROM tenant_users WHERE LOWER(email) = $1', [cleanEmail]);
        if (userCheck.rows.length > 0) {
          firebaseUid = userCheck.rows[0].firebase_uid;
        }
      }

      // 2. Generate a custom token using Firebase Admin
      if (firebaseUid) {
        const customToken = await admin.auth().createCustomToken(firebaseUid);
        return res.json({ message: 'OTP verified successfully', token: customToken });
      } else {
        // Fallback for first-time local login to allow auto-linking of new employees/admins
        console.log(`[verify-email-otp] No firebaseUid found for ${cleanEmail}. Falling back to MOCK_TOKEN_DEV for local onboarding.`);
        return res.json({ 
          message: 'OTP verified successfully (Local Dev Onboarding)', 
          token: 'MOCK_TOKEN_DEV' 
        });
      }
    } catch (err: any) {
      console.warn('⚠️ Firebase Admin failed to mint custom token. Falling back to local Dev Mock Auth mode.', err.message);
      return res.json({ 
        message: 'OTP verified successfully (Dev Mock Auth Mode)', 
        token: 'MOCK_TOKEN_DEV' 
      });
    }
  } else {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
});

// ─── MOBILE OTP (Staff Onboarding) ──────────────────────────────────────────
app.post('/api/auth/send-mobile-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

  const isTest = mobile.includes('000');
  const otp = isTest ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

  mobileOtpStore.set(mobile, { otp, expiresAt: Date.now() + 3 * 60 * 1000 });
  console.log(`[MOBILE OTP] ${mobile}: ${otp}`);

  // TODO: Integrate SMS gateway (Twilio / MSG91) for production
  res.json({ message: 'OTP sent successfully' });
});

app.post('/api/auth/verify-mobile-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP required' });

  const record = mobileOtpStore.get(mobile);
  if (!record) return res.status(400).json({ error: 'No OTP requested for this number' });

  if (Date.now() > record.expiresAt) {
    mobileOtpStore.delete(mobile);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (record.otp === otp) {
    mobileOtpStore.delete(mobile);
    return res.json({ verified: true, message: 'Mobile verified successfully' });
  } else {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Get Subscription Plans Endpoint
app.get('/api/plans', async (req, res) => {
  try {
    const plansResult = await pool.query('SELECT * FROM subscription_plans WHERE is_active = true');
    res.json(plansResult.rows);
  } catch (err: any) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: 'Failed to fetch subscription plans: ' + String(err) + ' - ' + err.message });
  }
});

// Upsert Tenant Draft
app.post('/api/tenant/draft', async (req, res) => {
  const { firebaseUid, draftData, step } = req.body;
  if (!firebaseUid || !draftData || step === undefined || step === null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await pool.query(
      `INSERT INTO tenant_drafts (firebase_uid, draft_data, step, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (firebase_uid) 
       DO UPDATE SET draft_data = EXCLUDED.draft_data, step = EXCLUDED.step, updated_at = CURRENT_TIMESTAMP`,
      [firebaseUid, JSON.stringify(draftData), step]
    );
    res.json({ message: 'Draft saved successfully' });
  } catch (err: any) {
    console.error('Error saving draft:', err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

// Auto-fix missing UNIQUE constraint on tenant_drafts
pool.query('ALTER TABLE tenant_drafts ADD CONSTRAINT unique_firebase_uid UNIQUE (firebase_uid);')
  .then(() => console.log('Successfully added UNIQUE constraint to firebase_uid'))
  .catch((e: any) => {
    require('fs').writeFileSync('d:/Infraops360/Code3/apps/backend/alter_table_error.txt', e.message);
  });

// Add subdomain column to tenants table if not exists
pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(255) UNIQUE;')
  .then(() => console.log('Checked/Added subdomain column to tenants'))
  .catch((e: any) => console.error('Error adding subdomain:', e.message));

// Add trial_ends_at, payment_status, razorpay_payment_id, razorpay_order_id columns if not exist
pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;')
  .then(() => console.log('Checked/Added trial_ends_at column to tenants'))
  .catch((e: any) => console.error('Error adding trial_ends_at:', e.message));

pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT \'active\';')
  .then(() => console.log('Checked/Added payment_status column to tenants'))
  .catch((e: any) => console.error('Error adding payment_status:', e.message));

pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);')
  .then(() => console.log('Checked/Added razorpay_payment_id column to tenants'))
  .catch((e: any) => console.error('Error adding razorpay_payment_id:', e.message));

pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);')
  .then(() => console.log('Checked/Added razorpay_order_id column to tenants'))
  .catch((e: any) => console.error('Error adding razorpay_order_id:', e.message));

pool.query(`
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_address TEXT;
`).then(() => console.log('Checked/Added company_address column to tenants'))
  .catch((e: any) => console.error('Error adding company_address:', e.message));

pool.query(`
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pan_number VARCHAR(100);
`).then(() => console.log('Checked/Added pan_number column to tenants'))
  .catch((e: any) => console.error('Error adding pan_number:', e.message));

pool.query(`
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS msme_number VARCHAR(100);
`).then(() => console.log('Checked/Added msme_number column to tenants'))
  .catch((e: any) => console.error('Error adding msme_number:', e.message));

pool.query(`
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_code VARCHAR(50);
`).then(async () => {
  console.log('Checked/Added company_code column to tenants');
  // Always recalculate company_code from company_name (6 uppercase letters)
  try {
    const allTenants = await pool.query('SELECT id, company_name FROM tenants');
    for (const row of allTenants.rows) {
      const raw = (row.company_name || 'TNT').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const code = raw.substring(0, 6) || 'TNT';
      await pool.query('UPDATE tenants SET company_code = $1 WHERE id = $2', [code, row.id]);
    }
    console.log('✅ Recalculated company_code for all tenants (6-char)');

    // Rebuild all member_ids using the updated company_code
    const tenants = await pool.query('SELECT id, company_code FROM tenants');
    for (const t of tenants.rows) {
      const prefix = t.company_code || 'TNT';
      const members = await pool.query('SELECT id FROM tenant_users WHERE tenant_id = $1 ORDER BY created_at ASC', [t.id]);
      let seq = 1;
      for (const m of members.rows) {
        seq++;
        const newId = `#${prefix}${String(seq).padStart(4, '0')}`;
        await pool.query('UPDATE tenant_users SET member_id = $1 WHERE id = $2', [newId, m.id]);
      }
    }
    console.log('✅ Rebuilt all member_ids with updated company_code prefix');
  } catch (err: any) {
    console.error('Error migrating company_code:', err.message);
  }
}).catch((e: any) => console.error('Error adding company_code:', e.message));

// Make pincode nullable in tenants table
pool.query('ALTER TABLE tenants ALTER COLUMN pincode DROP NOT NULL;')
  .then(() => console.log('Made pincode column nullable'))
  .catch((e: any) => console.log('Pincode nullability note:', e.message));

// Check/Create tenant_users table
pool.query(`
  CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    member_id VARCHAR(50),
    firebase_uid VARCHAR(128) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email),
    CONSTRAINT unique_tenant_mobile UNIQUE (tenant_id, mobile)
  );
`).then(() => {
  console.log('Checked/Created tenant_users table');
  // Create tenant_clients table
  pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(50) NOT NULL,
      legal_name VARCHAR(200),
      contact_person VARCHAR(200),
      mobile VARCHAR(20),
      email VARCHAR(200),
      website VARCHAR(200),
      billing_address TEXT,
      site_address TEXT,
      state VARCHAR(100),
      country VARCHAR(100),
      pincode VARCHAR(20),
      gst_number VARCHAR(20),
      pan_number VARCHAR(20),
      msme_status VARCHAR(50) DEFAULT 'Non-MSME',
      credit_limit NUMERIC(15, 2) DEFAULT 0.00,
      credit_days INTEGER DEFAULT 30,
      security_deposit NUMERIC(15, 2) DEFAULT 0.00,
      bank_guarantee TEXT,
      accounts_contact VARCHAR(200),
      finance_contact VARCHAR(200),
      status VARCHAR(20) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_tenant_client_code UNIQUE (tenant_id, code)
    );
  `).then(() => console.log('Checked/Created tenant_clients table'))
    .catch((e: any) => console.error('Error creating tenant_clients table:', e.message));

  // Create tenant_vendors table
  pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(50) NOT NULL,
      vendor_type VARCHAR(100) NOT NULL,
      contact_person VARCHAR(200),
      mobile VARCHAR(20),
      email VARCHAR(200),
      bank_name VARCHAR(200),
      account_number VARCHAR(100),
      ifsc VARCHAR(50),
      gst_registered BOOLEAN DEFAULT false,
      gst_number VARCHAR(20),
      pan_number VARCHAR(20),
      tds_applicable BOOLEAN DEFAULT false,
      tds_section VARCHAR(50),
      hsn_sac VARCHAR(50),
      gst_percentage NUMERIC(5, 2) DEFAULT 0.00,
      tds_percentage NUMERIC(5, 2) DEFAULT 0.00,
      status VARCHAR(20) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_tenant_vendor_code UNIQUE (tenant_id, code)
    );
  `).then(() => console.log('Checked/Created tenant_vendors table'))
    .catch((e: any) => console.error('Error creating tenant_vendors table:', e.message));

  // Create tenant_expense_categories table
  pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_expense_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      category_type VARCHAR(100) NOT NULL,
      hsn_sac VARCHAR(50),
      gst_percentage NUMERIC(5, 2) DEFAULT 0.00,
      tds_percentage NUMERIC(5, 2) DEFAULT 0.00,
      gl_account VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_tenant_expense_cat UNIQUE (tenant_id, name)
    );
  `).then(() => console.log('Checked/Created tenant_expense_categories table'))
    .catch((e: any) => console.error('Error creating tenant_expense_categories table:', e.message));

}).catch((e: any) => console.error('Error creating tenant_users table:', e.message));


app.get('/api/tenant/status/:uid', async (req, res) => {
  const { uid } = req.params;
  const { mobile, email } = req.query;

  try {
    // 1. Check if fully registered as Tenant Admin
    const adminResult = await pool.query('SELECT * FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    const admin = adminResult.rows[0];
    if (admin) {
      return res.json({ status: 'complete', percentage: 100, userType: 'admin' });
    }

    // 2. Check if fully registered as Team Member by UID
    const memberResult = await pool.query('SELECT * FROM tenant_users WHERE firebase_uid = $1', [uid]);
    const member = memberResult.rows[0];
    if (member) {
      return res.json({ status: 'complete', percentage: 100, userType: 'team_member', role: member.role });
    }

    // 2.5 Self-linking helper: Check if tenant admin exists by Mobile or Email but not yet linked by UID
    if (mobile || email) {
      const searchMobile = mobile ? String(mobile).trim() : '';
      const searchEmail = email ? String(email).trim() : '';

      const unlinkedAdminRes = await pool.query(`
        SELECT * FROM tenant_admins 
        WHERE RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 10) AND $1 <> ''
           OR LOWER(email) = LOWER($2) AND $2 <> ''
      `, [searchMobile, searchEmail]);

      const unlinkedAdmin = unlinkedAdminRes.rows[0];
      if (unlinkedAdmin) {
        await pool.query('UPDATE tenant_admins SET firebase_uid = $1 WHERE id = $2', [uid, unlinkedAdmin.id]);
        console.log(`Linked Firebase UID ${uid} to tenant admin ${unlinkedAdmin.admin_name} (${unlinkedAdmin.email})`);
        return res.json({ status: 'complete', percentage: 100, userType: 'admin' });
      }
    }

    // 3. Self-linking helper: Check if team member exists by Mobile or Email but not yet linked by UID
    if (mobile || email) {
      const searchMobile = mobile ? String(mobile).trim() : '';
      const searchEmail = email ? String(email).trim() : '';

      const unlinkedMemberRes = await pool.query(`
        SELECT * FROM tenant_users 
        WHERE RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 10) AND $1 <> ''
           OR LOWER(email) = LOWER($2) AND $2 <> ''
      `, [searchMobile, searchEmail]);

      const unlinkedMember = unlinkedMemberRes.rows[0];
      if (unlinkedMember) {
        await pool.query('UPDATE tenant_users SET firebase_uid = $1 WHERE id = $2', [uid, unlinkedMember.id]);
        console.log(`Linked Firebase UID ${uid} to team member ${unlinkedMember.name} (${unlinkedMember.email})`);
        return res.json({ status: 'complete', percentage: 100, userType: 'team_member', role: unlinkedMember.role });
      }
    }

    // 4. Check if there's a registration draft for Tenant Admin
    const draftResult = await pool.query('SELECT * FROM tenant_drafts WHERE firebase_uid = $1', [uid]);
    const draft = draftResult.rows[0];

    if (draft) {
      let parsedData = {};
      try {
        parsedData = JSON.parse(draft.draft_data);
      } catch (e) {
        console.error("Invalid JSON in draft:", e);
      }
      let percentage = 0;
      if (parsedData) {
        const requiredFields = [
          'companyName', 'industryType', 'country', 'state', 'city',
          'adminName', 'designation', 'mobile', 'email', 'subdomain'
        ];
        let filledCount = 0;
        requiredFields.forEach((field: string) => {
          if ((parsedData as any)[field] && typeof (parsedData as any)[field] === 'string' && (parsedData as any)[field].trim() !== '') {
            filledCount++;
          }
        });
        percentage = Math.round((filledCount / requiredFields.length) * 90);
      }

      res.json({
        status: 'draft',
        step: draft.step,
        data: parsedData,
        percentage: percentage
      });
    } else {
      res.json({ status: 'new', percentage: 0 });
    }
  } catch (err: any) {
    console.error('Error fetching status:', err);
    res.status(500).json({ error: 'Failed to fetch status: ' + err.message });
  }
});

// Fetch Tenant Profile details
app.get('/api/tenant/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  const { mobile, email } = req.query;
  try {
    // 1. Check if they are a Tenant Admin
    const queryAdmin = `
      SELECT 
        a.admin_name as "adminName",
        a.designation,
        a.mobile,
        a.email,
        t.id as "tenantId",
        t.subdomain,
        t.company_name as "companyName",
        t.industry_type as "industryType",
        t.country,
        t.state,
        t.pincode,
        t.city,
        t.company_website as "companyWebsite",
        t.company_size as "companySize",
        t.gst_number as "gstNumber",
        t.pan_number as "panNumber",
        t.msme_number as "msmeNumber",
        t.company_code as "companyCode",
        'admin' as "userType",
        '#' || COALESCE(t.company_code, 'TNT') || '0001' as "memberId"
      FROM tenant_admins a
      JOIN tenants t ON a.tenant_id = t.id
      WHERE a.firebase_uid = $1
    `;
    const resultAdmin = await pool.query(queryAdmin, [uid]);
    if (resultAdmin.rows.length > 0) {
      return res.json(resultAdmin.rows[0]);
    }

    // 2. Check if they are a Team Member
    const queryMember = `
      SELECT 
        u.name as "adminName",
        u.role as "designation",
        u.mobile,
        u.email,
        t.id as "tenantId",
        t.subdomain,
        t.company_name as "companyName",
        t.industry_type as "industryType",
        t.country,
        t.state,
        t.pincode,
        t.city,
        u.department,
        'team_member' as "userType",
        u.member_id as "memberId",
        u.status
      FROM tenant_users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.firebase_uid = $1
    `;
    const resultMember = await pool.query(queryMember, [uid]);
    if (resultMember.rows.length > 0) {
      return res.json(resultMember.rows[0]);
    }

    // 3. Match and link if mobile or email parameters are passed
    if (mobile || email) {
      const cleanMobile = (mobile as string || '').replace(/\D/g, '');
      const last10 = cleanMobile.substring(cleanMobile.length - 10);

      // Check tenant_admins first
      let unlinkedAdmin = null;
      if (last10.length === 10) {
        const matchingAdmins = await pool.query(
          `SELECT * FROM tenant_admins 
           WHERE REGEXP_REPLACE(mobile, '[^0-9]', '', 'g') LIKE $1`,
          [`%${last10}`]
        );
        unlinkedAdmin = matchingAdmins.rows[0];
      }
      if (!unlinkedAdmin && email) {
        const matchingAdmins = await pool.query(
          `SELECT * FROM tenant_admins 
           WHERE LOWER(email) = LOWER($1)`,
          [email]
        );
        unlinkedAdmin = matchingAdmins.rows[0];
      }

      if (unlinkedAdmin) {
        await pool.query('UPDATE tenant_admins SET firebase_uid = $1 WHERE id = $2', [uid, unlinkedAdmin.id]);
        const refetchAdmin = await pool.query(queryAdmin, [uid]);
        if (refetchAdmin.rows.length > 0) {
          return res.json(refetchAdmin.rows[0]);
        }
      }

      let unlinkedMember = null;
      if (last10.length === 10) {
        const matchingMembers = await pool.query(
          `SELECT * FROM tenant_users 
           WHERE REGEXP_REPLACE(mobile, '[^0-9]', '', 'g') LIKE $1`,
          [`%${last10}`]
        );
        unlinkedMember = matchingMembers.rows[0];
      }

      if (!unlinkedMember && email) {
        const matchingMembers = await pool.query(
          `SELECT * FROM tenant_users 
           WHERE LOWER(email) = LOWER($1)`,
          [email]
        );
        unlinkedMember = matchingMembers.rows[0];
      }

      if (unlinkedMember) {
        // Link their firebase_uid
        await pool.query('UPDATE tenant_users SET firebase_uid = $1 WHERE id = $2', [uid, unlinkedMember.id]);
        // Refetch profile
        const refetchResult = await pool.query(queryMember, [uid]);
        if (refetchResult.rows.length > 0) {
          return res.json(refetchResult.rows[0]);
        }
      }
    }

    res.status(404).json({ error: 'Profile not found' });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Update Tenant Profile details
app.put('/api/tenant/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  const {
    adminName,
    designation,
    mobile,
    email,
    companyName,
    industryType,
    companySize,
    companyWebsite,
    gstNumber,
    panNumber,
    msmeNumber,
    city,
    state,
    country,
    pincode
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update tenant_admins and get tenant_id
    const adminUpdateRes = await client.query(
      `UPDATE tenant_admins 
       SET admin_name = $1, designation = $2, mobile = $3, email = $4 
       WHERE firebase_uid = $5 
       RETURNING tenant_id`,
      [adminName, designation, mobile, email, uid]
    );

    if (adminUpdateRes.rows.length === 0) {
      throw new Error('Tenant administrator not found');
    }

    const tenantId = adminUpdateRes.rows[0].tenant_id;

    // 2. Update tenants
    await client.query(
      `UPDATE tenants 
       SET company_name = $1, industry_type = $2, company_size = $3, 
           company_website = $4, gst_number = $5, city = $6, 
           state = $7, country = $8, pincode = $9,
           pan_number = $10, msme_number = $11
       WHERE id = $12`,
      [
        companyName,
        industryType,
        companySize,
        companyWebsite,
        gstNumber,
        city,
        state,
        country,
        pincode,
        panNumber || null,
        msmeNumber || null,
        tenantId
      ]
    );

    await client.query('COMMIT');
    res.json({ message: 'Profile updated successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error updating profile:', err);
    res.status(400).json({ error: err.message || 'Failed to update profile' });
  } finally {
    client.release();
  }
});



// Check Subdomain Availability Endpoint
app.get('/api/tenant/check-subdomain', async (req, res) => {
  const { subdomain } = req.query;
  if (!subdomain) {
    return res.status(400).json({ error: 'Subdomain parameter is required' });
  }
  try {
    const result = await pool.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
    if (result.rows.length > 0) {
      return res.json({ available: false });
    }
    return res.json({ available: true });
  } catch (err: any) {
    console.error('Error checking subdomain:', err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

// Tenant Registration Endpoint
app.post('/api/tenant/register', async (req, res) => {
  const {
    companyName,
    industryType,
    country,
    state,
    pincode,
    city,
    companyWebsite,
    companySize,
    companyAddress,
    gstNumber,
    panNumber,
    msmeNumber,
    adminName,
    designation,
    mobile,
    email,
    password,
    subscriptionPlanId,
    firebaseUid,
    subdomain,
    startFreeTrial,
    razorpayPaymentId,
    razorpayOrderId,
    customFields
  } = req.body;

  const client = await pool.connect();

  try {
    // 1. Begin Transaction
    await client.query('BEGIN');

    const finalEmail = email || `admin-${Date.now()}@easyapps.com`;
    const finalMobile = mobile || `0000-${Date.now()}`;
    const finalCompanyName = companyName || 'My Enterprise';
    const finalAdminName = adminName || 'Administrator';

    // 2. Check if email already exists
    const emailCheckResult = await client.query('SELECT id FROM tenant_admins WHERE email = $1', [finalEmail]);
    if (emailCheckResult.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Check if subdomain already exists
    if (subdomain) {
      const subdomainCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
      if (subdomainCheck.rows.length > 0) {
        throw new Error('Subdomain is already taken');
      }
    }

    const trialEndsAt = startFreeTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null;
    const paymentStatus = startFreeTrial ? 'trial' : 'paid';

    // Generate unique company code (up to 6 uppercase letters from tenant company name)
    const baseCode = finalCompanyName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 6) || 'TNT';
    let companyCode = baseCode;
    let attempts = 0;
    let codeUnique = false;
    while (!codeUnique && attempts < 100) {
      const checkCode = attempts === 0 ? companyCode : `${companyCode.substring(0, 5)}${attempts}`;
      const codeCheck = await client.query('SELECT id FROM tenants WHERE company_code = $1', [checkCode]);
      if (codeCheck.rows.length === 0) {
        companyCode = checkCode;
        codeUnique = true;
      } else {
        attempts++;
      }
    }

    // 3. Insert into Tenants table
    const tenantResult = await client.query(
      `INSERT INTO tenants (
        company_name, industry_type, country, state, pincode, city, 
        company_website, company_size, company_address, gst_number, pan_number, msme_number, subscription_plan_id, subdomain,
        trial_ends_at, payment_status, razorpay_payment_id, razorpay_order_id, company_code, custom_fields
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
      [
        finalCompanyName,
        industryType,
        country,
        state,
        pincode || null,
        city,
        companyWebsite || null,
        companySize || null,
        companyAddress || null,
        gstNumber || null,
        panNumber || null,
        msmeNumber || null,
        subscriptionPlanId,
        subdomain || null,
        trialEndsAt,
        paymentStatus,
        razorpayPaymentId || null,
        razorpayOrderId || null,
        companyCode,
        customFields ? JSON.stringify(customFields) : null
      ]
    );

    const tenantId = tenantResult.rows[0].id;

    // 4. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password || Math.random().toString(36).substring(2, 15), saltRounds);

    // 5. Insert into Tenant Admins table
    await client.query(
      `INSERT INTO tenant_admins (tenant_id, firebase_uid, admin_name, designation, mobile, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, firebaseUid, finalAdminName, designation, finalMobile, finalEmail, hashedPassword]
    );

    // 6. Delete the draft if they had one
    if (firebaseUid) {
      await client.query('DELETE FROM tenant_drafts WHERE firebase_uid = $1', [firebaseUid]);
    }

    // 7. Commit transaction
    await client.query('COMMIT');

    res.status(201).json({ message: 'Tenant registered successfully', tenantId });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message || 'Failed to register tenant' });
  } finally {
    client.release();
  }
});

// ==========================================
// SUPER ADMIN ENDPOINTS
// ==========================================

// Get Platform Stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalTenantsResult = await pool.query('SELECT COUNT(*) as count FROM tenants');
    const revenueResult = await pool.query(`
      SELECT SUM(p.price_monthly) as total 
      FROM tenants t 
      JOIN subscription_plans p ON t.subscription_plan_id = p.id
    `);
    const activeTrialsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tenants t 
      JOIN subscription_plans p ON t.subscription_plan_id = p.id 
      WHERE p.name = 'Trial'
    `);

    res.json({
      totalTenants: parseInt(totalTenantsResult.rows[0].count, 10),
      monthlyRevenue: parseFloat(revenueResult.rows[0].total) || 0,
      activeTrials: parseInt(activeTrialsResult.rows[0].count, 10),
      expiringSoon: 0 // Placeholder logic for now
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get Recent Tenants
app.get('/api/admin/tenants', async (req, res) => {
  try {
    const tenantsResult = await pool.query(`
      SELECT 
        t.id, 
        t.company_name, 
        t.created_at,
        p.name as plan_name,
        p.price_monthly,
        a.admin_name,
        a.email,
        a.mobile
      FROM tenants t
      LEFT JOIN subscription_plans p ON t.subscription_plan_id = p.id
      LEFT JOIN tenant_admins a ON t.id = a.tenant_id
      ORDER BY t.created_at DESC
    `);
    res.json(tenantsResult.rows);
  } catch (err: any) {
    console.error('Error fetching admin tenants:', err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// GET Form Fields Configuration
app.get('/api/admin/form-config/:formType', async (req, res) => {
  const { formType } = req.params;
  try {
    const fieldsRes = await pool.query(
      'SELECT id, form_type as "formType", field_key as "fieldKey", field_label as "fieldLabel", field_type as "fieldType", is_default as "isDefault", is_hidden as "isHidden", is_required as "isRequired", dropdown_options as "dropdownOptions" FROM form_fields_config WHERE form_type = $1 ORDER BY is_default DESC, id ASC',
      [formType]
    );
    res.json(fieldsRes.rows);
  } catch (err: any) {
    console.error('Error fetching form config:', err);
    res.status(500).json({ error: 'Failed to fetch form configuration: ' + err.message });
  }
});

// PUT/Update Form Fields Configuration
app.put('/api/admin/form-config/:formType', async (req, res) => {
  const { formType } = req.params;
  const { fields } = req.body;
  if (!Array.isArray(fields)) {
    return res.status(400).json({ error: 'fields must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch existing keys to find which ones were deleted
    const existingRes = await client.query('SELECT field_key FROM form_fields_config WHERE form_type = $1', [formType]);
    const existingKeys = existingRes.rows.map(r => r.field_key);
    const receivedKeys = fields.map(f => f.fieldKey);

    // Delete custom fields that are no longer present
    const keysToDelete = existingKeys.filter(k => !receivedKeys.includes(k));
    for (const key of keysToDelete) {
      await client.query(
        'DELETE FROM form_fields_config WHERE form_type = $1 AND field_key = $2 AND is_default = false',
        [formType, key]
      );
    }

    // Upsert fields
    for (const field of fields) {
      const { fieldKey, fieldLabel, fieldType, isDefault, isHidden, isRequired, dropdownOptions } = field;
      await client.query(
        `INSERT INTO form_fields_config 
         (form_type, field_key, field_label, field_type, is_default, is_hidden, is_required, dropdown_options)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (form_type, field_key)
         DO UPDATE SET 
           field_label = EXCLUDED.field_label,
           field_type = EXCLUDED.field_type,
           is_hidden = EXCLUDED.is_hidden,
           is_required = EXCLUDED.is_required,
           dropdown_options = EXCLUDED.dropdown_options`,
        [
          formType,
          fieldKey,
          fieldLabel,
          fieldType || 'text',
          isDefault || false,
          isHidden || false,
          isRequired || false,
          dropdownOptions || null
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Form configuration updated successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error updating form config:', err);
    res.status(500).json({ error: 'Failed to update form configuration: ' + err.message });
  } finally {
    client.release();
  }
});

// Update Subscription Plan
app.put('/api/admin/plans/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price_monthly, included_tonnage, included_equipment, additional_tonnage_price, additional_equipment_price } = req.body;

  try {
    await pool.query(
      `UPDATE subscription_plans 
       SET name = $1, description = $2, price_monthly = $3, included_tonnage = $4, included_equipment = $5, additional_tonnage_price = $6, additional_equipment_price = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [name, description, price_monthly, included_tonnage, included_equipment, additional_tonnage_price, additional_equipment_price, id]
    );
    res.json({ message: 'Plan updated successfully' });
  } catch (err: any) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});
// Razorpay Create Order Endpoint
app.post('/api/payment/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  try {
    const auth = Buffer.from('rzp_test_TDMPnPm4wjZUET:yZIt2uhhpI35UQCdEXUe1VAi').toString('base64');
    // Using standard global fetch (Node 18+) to request order creation from Razorpay API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // amount in paise
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || 'Razorpay order creation failed');
    }
    res.json(data);
  } catch (err: any) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ error: err.message || 'Payment server error' });
  }
});

// Debug Database Endpoint
app.get('/api/debug-db', async (req, res) => {
  try {
    const tenants = await pool.query('SELECT * FROM tenants LIMIT 10');
    const admins = await pool.query('SELECT * FROM tenant_admins LIMIT 10');
    const users = await pool.query('SELECT * FROM tenant_users LIMIT 10').catch((e: any) => ({ error: e.message, rows: [] }));
    const cols = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('tenants', 'tenant_users')
      ORDER BY table_name, column_name;
    `);
    res.json({
      tenants: tenants.rows,
      admins: admins.rows,
      users: users,
      columns: cols.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Team Members for a Tenant
app.get('/api/tenant/team/:uid', async (req, res) => {
  const { uid } = req.params;
  console.log(`[GET /api/tenant/team/:uid] Request for uid: "${uid}"`);
  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
      console.log(`[GET /api/tenant/team/:uid] Found tenant_id ${tenantId} in tenant_admins`);
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
        console.log(`[GET /api/tenant/team/:uid] Found tenant_id ${tenantId} in tenant_users`);
      } else {
        console.warn(`[GET /api/tenant/team/:uid] No admin or user found matching firebase_uid: "${uid}"`);
      }
    }

    if (!tenantId) {
      return res.json([]);
    }

    const teamRes = await pool.query(`
      SELECT u.*, d.name AS division_name
      FROM tenant_users u
      LEFT JOIN tenant_divisions d ON d.id = u.division_id
      WHERE u.tenant_id = $1
      ORDER BY u.created_at DESC
    `, [tenantId]);
    console.log(`[GET /api/tenant/team/:uid] Returning ${teamRes.rows.length} team members for tenant_id ${tenantId}`);
    res.json(teamRes.rows);
  } catch (err: any) {
    console.error('Error fetching team:', err);
    res.status(500).json({ error: 'Failed to fetch team members: ' + err.message });
  }
});

// Get Next Available Member ID (Gap-Filler recommendation)
app.get('/api/tenant/next-member-id/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }

    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant profile not found' });
    }

    // Fetch company code and name to generate prefix
    const tenantRes = await pool.query('SELECT company_code, company_name FROM tenants WHERE id = $1', [tenantId]);
    const tenant = tenantRes.rows[0];
    const prefix = tenant.company_code || tenant.company_name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3) || 'TNT';

    let assigned = false;
    let seqNum = 2;
    let nextMemberId = '';
    while (!assigned) {
      const padded = String(seqNum).padStart(4, '0');
      nextMemberId = `${prefix}-${padded}`;
      const checkId = await pool.query(
        'SELECT id FROM tenant_users WHERE tenant_id = $1 AND member_id = $2',
        [tenantId, nextMemberId]
      );
      if (checkId.rows.length === 0) {
        assigned = true;
      } else {
        seqNum++;
      }
    }
    res.json({ nextMemberId });
  } catch (err: any) {
    console.error('Error getting next member ID:', err);
    res.status(500).json({ error: 'Failed to get next member ID: ' + err.message });
  }
});

// Add Team Member
app.post('/api/tenant/team', async (req, res) => {
  const { adminUid, name, role, department, email, mobile, memberId, divisionId } = req.body;
  if (!adminUid || !name || !role || !department || !email || !mobile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const tenantId = await getTenantIdForUser(adminUid);
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant profile not found' });
    }

    // Check duplicate email or mobile for this tenant specifically
    const dupCheck = await pool.query(
      'SELECT id FROM tenant_users WHERE tenant_id = $1 AND (email = $2 OR mobile = $3)',
      [tenantId, email, mobile]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: 'A team member with this email or mobile number is already registered for your tenant.' });
    }

    let finalMemberId = '';
    if (memberId && String(memberId).trim() !== '') {
      finalMemberId = String(memberId).trim();
      // Check duplicate memberId for this tenant specifically
      const dupIdCheck = await pool.query(
        'SELECT id FROM tenant_users WHERE tenant_id = $1 AND LOWER(member_id) = LOWER($2)',
        [tenantId, finalMemberId]
      );
      if (dupIdCheck.rows.length > 0) {
        return res.status(400).json({ error: `Member ID "${finalMemberId}" is already assigned to another team member.` });
      }
    } else {
      // Sequence Generator Gap-Filler (Starts from #INFOPS0001, fills any deleted gaps)
      let assigned = false;
      let seqNum = 1;
      while (!assigned) {
        const padded = String(seqNum).padStart(4, '0');
        finalMemberId = `#INFOPS${padded}`;
        const checkId = await pool.query(
          'SELECT id FROM tenant_users WHERE tenant_id = $1 AND member_id = $2',
          [tenantId, finalMemberId]
        );
        if (checkId.rows.length === 0) {
          assigned = true;
        } else {
          seqNum++;
        }
      }
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_users (tenant_id, name, role, department, email, mobile, status, member_id, division_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active', $7, $8)
       RETURNING *`,
      [tenantId, name, role, department, email, mobile, finalMemberId, divisionId || null]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    console.error('Error adding team member:', err);
    res.status(500).json({ error: 'Failed to add team member: ' + err.message });
  }
});

// Update Employee Shift Status
app.patch('/api/tenant/employee/status', async (req, res) => {
  const { firebaseUid, status } = req.body;
  if (!firebaseUid || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const updateRes = await pool.query(
      'UPDATE tenant_users SET status = $1 WHERE firebase_uid = $2 RETURNING *',
      [status, firebaseUid]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    const employee = updateRes.rows[0];

    // Log shifts in attendance history table
    if (status === 'On Duty') {
      const activeCheck = await pool.query(
        'SELECT id FROM tenant_attendance_logs WHERE user_id = $1 AND check_out_time IS NULL',
        [employee.id]
      );
      if (activeCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO tenant_attendance_logs (tenant_id, user_id, check_in_time, status)
           VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
          [employee.tenant_id, employee.id, status]
        );
      }
    } else if (status === 'Offline' || status === 'Away') {
      const activeCheck = await pool.query(
        'SELECT id, check_in_time FROM tenant_attendance_logs WHERE user_id = $1 AND check_out_time IS NULL ORDER BY check_in_time DESC LIMIT 1',
        [employee.id]
      );
      if (activeCheck.rows.length > 0) {
        const logId = activeCheck.rows[0].id;
        const checkIn = new Date(activeCheck.rows[0].check_in_time);
        const checkOut = new Date();
        const hours = parseFloat(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
        
        await pool.query(
          `UPDATE tenant_attendance_logs 
           SET check_out_time = CURRENT_TIMESTAMP, status = $1, work_hours = $2
           WHERE id = $3`,
          [status, hours, logId]
        );
      }
    }

    res.json(employee);
  } catch (err: any) {
    console.error('Error updating employee status:', err);
    res.status(500).json({ error: 'Failed to update status: ' + err.message });
  }
});

// GET Attendance/Login Logs Report for HR
app.get('/api/tenant/attendance/report', async (req, res) => {
  const { tenantId, month, role, search } = req.query;
  if (!tenantId) {
    return res.status(400).json({ error: 'tenantId is required' });
  }

  try {
    // 1. Check if the table is empty for this tenant, and auto-seed mock history if needed
    const countCheck = await pool.query('SELECT COUNT(*) FROM tenant_attendance_logs WHERE tenant_id = $1', [tenantId]);
    const recordCount = parseInt(countCheck.rows[0].count, 10);
    
    if (recordCount === 0) {
      // Fetch some active team members from the DB to seed their history logs
      const membersRes = await pool.query('SELECT id, name, role FROM tenant_users WHERE tenant_id = $1 LIMIT 8', [tenantId]);
      if (membersRes.rows.length > 0) {
        console.log(`Auto-seeding mock attendance logs for tenant ${tenantId}`);
        const today = new Date();
        const year = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed
        
        // Let's generate 20 mock entries spanning the last 15 days for different roles
        for (let i = 0; i < 20; i++) {
          const day = Math.max(1, today.getDate() - (i % 15));
          const member = membersRes.rows[i % membersRes.rows.length];
          
          // Seed a login/logout time
          const checkIn = new Date(year, currentMonth, day, 8 + (i % 3), 0, 0); // ~8am - 10am
          const checkOut = new Date(year, currentMonth, day, 16 + (i % 3), 30 + (i * 5) % 30, 0); // ~4pm - 6pm
          const hours = parseFloat(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
          
          await pool.query(
            `INSERT INTO tenant_attendance_logs (tenant_id, user_id, check_in_time, check_out_time, status, work_hours)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, member.id, checkIn, checkOut, 'Offline', hours]
          );
        }
      }
    }

    // 2. Query and return filtered attendance logs
    let queryStr = `
      SELECT 
        l.id,
        l.check_in_time AS "checkInTime",
        l.check_out_time AS "checkOutTime",
        l.status,
        l.work_hours AS "workHours",
        u.name AS "employeeName",
        u.role AS "role",
        u.department AS "department",
        u.member_id AS "memberId"
      FROM tenant_attendance_logs l
      JOIN tenant_users u ON l.user_id = u.id
      WHERE l.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (month && month !== 'All') {
      queryStr += ` AND TO_CHAR(l.check_in_time, 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (role && role !== 'All') {
      queryStr += ` AND (LOWER(u.role) = LOWER($${paramIndex}) OR LOWER(u.sub_role) = LOWER($${paramIndex}))`;
      params.push(role);
      paramIndex++;
    }

    if (search && String(search).trim() !== '') {
      queryStr += ` AND (LOWER(u.name) LIKE LOWER($${paramIndex}) OR LOWER(u.member_id) LIKE LOWER($${paramIndex}))`;
      params.push(`%${String(search).trim()}%`);
      paramIndex++;
    }

    queryStr += ` ORDER BY l.check_in_time DESC`;

    const reportRes = await pool.query(queryStr, params);
    res.json(reportRes.rows);
  } catch (err: any) {
    console.error('Error fetching attendance logs report:', err);
    res.status(500).json({ error: 'Failed to fetch attendance logs: ' + err.message });
  }
});

// Delete Team Member
app.delete('/api/tenant/team/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteRes = await pool.query('DELETE FROM tenant_users WHERE id = $1 RETURNING *', [id]);
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json({ message: 'Team member deleted successfully', member: deleteRes.rows[0] });
  } catch (err: any) {
    console.error('Error deleting team member:', err);
    res.status(500).json({ error: 'Failed to delete team member: ' + err.message });
  }
});

// Accounts Module - Clients API
app.get('/api/tenant/accounts/clients/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }
    if (!tenantId) return res.json([]);

    const clientsRes = await pool.query(
      'SELECT * FROM tenant_clients WHERE tenant_id = $1 ORDER BY name ASC',
      [tenantId]
    );
    res.json(clientsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/accounts/clients', async (req, res) => {
  const {
    adminUid, name, code, legalName, contactPerson, mobile, email, website,
    billingAddress, siteAddress, state, country, pincode, gstNumber, panNumber,
    msmeStatus, creditLimit, creditDays, securityDeposit, bankGuarantee,
    accountsContact, financeContact, status
  } = req.body;

  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [adminUid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [adminUid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }
    if (!tenantId) return res.status(400).json({ error: 'Tenant profile not found' });

    const dupCheck = await pool.query(
      'SELECT id FROM tenant_clients WHERE tenant_id = $1 AND LOWER(code) = LOWER($2)',
      [tenantId, code]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: `Client Code "${code}" is already in use.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_clients (
        tenant_id, name, code, legal_name, contact_person, mobile, email, website,
        billing_address, site_address, state, country, pincode, gst_number, pan_number,
        msme_status, credit_limit, credit_days, security_deposit, bank_guarantee,
        accounts_contact, finance_contact, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        tenantId, name, code, legalName || null, contactPerson || null, mobile || null, email || null, website || null,
        billingAddress || null, siteAddress || null, state || null, country || null, pincode || null, gstNumber || null, panNumber || null,
        msmeStatus || 'Non-MSME', creditLimit || 0, creditDays || 30, securityDeposit || 0, bankGuarantee || null,
        accountsContact || null, financeContact || null, status || 'Active'
      ]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Accounts Module - Vendors API
app.get('/api/tenant/accounts/vendors/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }
    if (!tenantId) return res.json([]);

    const vendorsRes = await pool.query(
      'SELECT * FROM tenant_vendors WHERE tenant_id = $1 ORDER BY name ASC',
      [tenantId]
    );
    res.json(vendorsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/tenant/projects/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    if (uid && uid !== 'undefined') {
      const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
      if (adminRes.rows.length > 0) tenantId = adminRes.rows[0].tenant_id;
      else {
        const userRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
        if (userRes.rows.length > 0) tenantId = userRes.rows[0].tenant_id;
      }
    }
    const targetTenantId = tenantId || 1;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_projects (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL UNIQUE,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        location_block VARCHAR(255),
        customer VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const dbRes = await pool.query('SELECT * FROM tenant_projects WHERE tenant_id = $1 ORDER BY id DESC', [targetTenantId]);
    res.json(dbRes.rows);
  } catch (err: any) {
    res.json([]);
  }
});

// GET Worksites for a Tenant
app.get('/api/tenant/worksites/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    if (uid && uid !== 'undefined') {
      const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
      if (adminRes.rows.length > 0) tenantId = adminRes.rows[0].tenant_id;
      else {
        const userRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
        if (userRes.rows.length > 0) tenantId = userRes.rows[0].tenant_id;
      }
    }
    const targetTenantId = tenantId || 1;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_worksites (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const dbRes = await pool.query('SELECT * FROM tenant_worksites WHERE tenant_id = $1 ORDER BY id DESC', [targetTenantId]);
    res.json(dbRes.rows);
  } catch (err: any) {
    res.json([]);
  }
});

app.post('/api/tenant/accounts/vendors', async (req, res) => {
  const {
    adminUid, name, code, vendorType, contactPerson, mobile, email,
    bankName, accountNumber, ifsc, gstRegistered, gstNumber, panNumber,
    tdsApplicable, tdsSection, hsn_sac, gstPercentage, tdsPercentage, status
  } = req.body;

  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [adminUid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [adminUid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }
    if (!tenantId) return res.status(404).json({ error: 'Tenant profile not found' });

    const dupCheck = await pool.query(
      'SELECT id FROM tenant_vendors WHERE tenant_id = $1 AND LOWER(code) = LOWER($2)',
      [tenantId, code]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: `Vendor Code "${code}" is already in use.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_vendors (
        tenant_id, name, code, vendor_type, contact_person, mobile, email,
        bank_name, account_number, ifsc, gst_registered, gst_number, pan_number,
        tds_applicable, tds_section, hsn_sac, gst_percentage, tds_percentage, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        tenantId, name, code, vendorType, contactPerson || null, mobile || null, email || null,
        bankName || null, accountNumber || null, ifsc || null, gstRegistered || false, gstNumber || null, panNumber || null,
        tdsApplicable || false, tdsSection || null, hsn_sac || null, gstPercentage || 0, tdsPercentage || 0, status || 'Active'
      ]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Accounts Module - Expense Categories API
app.get('/api/tenant/accounts/expense-categories/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }
    if (!tenantId) return res.status(404).json({ error: 'Tenant profile not found' });

    const catsRes = await pool.query(
      'SELECT * FROM tenant_expense_categories WHERE tenant_id = $1 ORDER BY name ASC',
      [tenantId]
    );
    res.json(catsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/accounts/expense-categories', async (req, res) => {
  const { adminUid, name, categoryType, hsn_sac, gstPercentage, tdsPercentage, glAccount } = req.body;

  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [adminUid]);
    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
    } else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [adminUid]);
      if (memberRes.rows.length > 0) {
        tenantId = memberRes.rows[0].tenant_id;
      }
    }
    if (!tenantId) return res.status(404).json({ error: 'Tenant profile not found' });

    const dupCheck = await pool.query(
      'SELECT id FROM tenant_expense_categories WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
      [tenantId, name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: `Category Name "${name}" is already in use.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_expense_categories (
        tenant_id, name, category_type, hsn_sac, gst_percentage, tds_percentage, gl_account
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [tenantId, name, categoryType, hsn_sac || null, gstPercentage || 0, tdsPercentage || 0, glAccount || null]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invoice / Billing Tables ─────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS tenant_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES tenant_clients(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    place_of_supply VARCHAR(100),
    reference_number VARCHAR(100),
    taxable_amount NUMERIC(15, 2) DEFAULT 0.00,
    cgst NUMERIC(15, 2) DEFAULT 0.00,
    sgst NUMERIC(15, 2) DEFAULT 0.00,
    igst NUMERIC(15, 2) DEFAULT 0.00,
    tds_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    net_payable NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_invoice_number UNIQUE (tenant_id, invoice_number)
  );
`).then(() => console.log('Checked/Created tenant_invoices table'))
  .catch((e: any) => console.error('Error creating tenant_invoices:', e.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS tenant_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES tenant_invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    hsn_sac VARCHAR(50),
    quantity NUMERIC(15, 3) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'Nos',
    rate NUMERIC(15, 2) DEFAULT 0.00,
    taxable_value NUMERIC(15, 2) DEFAULT 0.00,
    gst_percentage NUMERIC(5, 2) DEFAULT 18.00,
    tds_percentage NUMERIC(5, 2) DEFAULT 0.00,
    gst_amount NUMERIC(15, 2) DEFAULT 0.00,
    tds_amount NUMERIC(15, 2) DEFAULT 0.00,
    line_total NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => console.log('Checked/Created tenant_invoice_items table'))
  .catch((e: any) => console.error('Error creating tenant_invoice_items:', e.message));

// ─── Invoice Sequence Helper ───────────────────────────────────────────────────
async function generateInvoiceNumber(tenantId: number): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM tenant_invoices WHERE tenant_id = $1 AND EXTRACT(YEAR FROM created_at) = $2`,
    [tenantId, year]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
}

// ─── GET /api/tenant/invoices/:uid ─────────────────────────────────────────────
app.get('/api/tenant/invoices/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [uid]);
    if (adminRes.rows.length > 0) tenantId = adminRes.rows[0].tenant_id;
    else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [uid]);
      if (memberRes.rows.length > 0) tenantId = memberRes.rows[0].tenant_id;
    }
    if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

    const invRes = await pool.query(`
      SELECT i.*, c.name AS client_name, c.gst_number AS client_gst,
             c.state AS client_state
      FROM tenant_invoices i
      LEFT JOIN tenant_clients c ON c.id = i.client_id
      WHERE i.tenant_id = $1
      ORDER BY i.created_at DESC
    `, [tenantId]);

    // Attach line items for each invoice
    const invoices = await Promise.all(invRes.rows.map(async (inv: any) => {
      const itemsRes = await pool.query(
        'SELECT * FROM tenant_invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC',
        [inv.id]
      );
      return { ...inv, items: itemsRes.rows };
    }));

    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/tenant/invoices ─────────────────────────────────────────────────
app.post('/api/tenant/invoices', async (req, res) => {
  const { adminUid, clientId, invoiceDate, dueDate, placeOfSupply, referenceNumber,
    items, notes, tenantState } = req.body;

  try {
    let tenantId = null;
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [adminUid]);
    if (adminRes.rows.length > 0) tenantId = adminRes.rows[0].tenant_id;
    else {
      const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [adminUid]);
      if (memberRes.rows.length > 0) tenantId = memberRes.rows[0].tenant_id;
    }
    if (!tenantId) return res.status(404).json({ error: 'Tenant not found' });

    // Determine GST split: IGST if inter-state, CGST+SGST if intra-state
    const isInterState = placeOfSupply && tenantState &&
      placeOfSupply.trim().toLowerCase() !== tenantState.trim().toLowerCase();

    // Calculate totals from line items
    let taxableAmount = 0, cgst = 0, sgst = 0, igst = 0, tdsTotal = 0;
    const processedItems = (items || []).map((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstPct = parseFloat(item.gstPercentage) || 0;
      const tdsPct = parseFloat(item.tdsPercentage) || 0;
      const taxableValue = qty * rate;
      const gstAmount = (taxableValue * gstPct) / 100;
      const tdsAmount = (taxableValue * tdsPct) / 100;
      const lineTotal = taxableValue + gstAmount;

      taxableAmount += taxableValue;
      if (isInterState) igst += gstAmount;
      else { cgst += gstAmount / 2; sgst += gstAmount / 2; }
      tdsTotal += tdsAmount;

      return { ...item, taxableValue, gstAmount, tdsAmount, lineTotal };
    });

    const totalAmount = taxableAmount + cgst + sgst + igst;
    const netPayable = totalAmount - tdsTotal;
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Insert invoice + items in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const invInsert = await client.query(`
        INSERT INTO tenant_invoices (
          tenant_id, client_id, invoice_number, invoice_date, due_date,
          place_of_supply, reference_number, taxable_amount, cgst, sgst, igst,
          tds_amount, total_amount, net_payable, notes, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'Draft')
        RETURNING *
      `, [tenantId, clientId || null, invoiceNumber, invoiceDate, dueDate,
        placeOfSupply || null, referenceNumber || null,
        taxableAmount, cgst, sgst, igst, tdsTotal, totalAmount, netPayable, notes || null]);

      const invoice = invInsert.rows[0];
      for (const item of processedItems) {
        await client.query(`
          INSERT INTO tenant_invoice_items (
            invoice_id, description, hsn_sac, quantity, unit, rate,
            taxable_value, gst_percentage, tds_percentage, gst_amount, tds_amount, line_total
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `, [invoice.id, item.description, item.hsn_sac || null, item.quantity, item.unit || 'Nos',
        item.rate, item.taxableValue, item.gstPercentage || 0, item.tdsPercentage || 0,
        item.gstAmount, item.tdsAmount, item.lineTotal]);
      }
      await client.query('COMMIT');
      res.status(201).json({ ...invoice, items: processedItems });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/tenant/invoices/:id/status ─────────────────────────────────────
app.patch('/api/tenant/invoices/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    const result = await pool.query(
      'UPDATE tenant_invoices SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/tenant/invoices/:id ──────────────────────────────────────────
app.delete('/api/tenant/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT status FROM tenant_invoices WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    if (check.rows[0].status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft invoices can be deleted' });
    }
    await pool.query('DELETE FROM tenant_invoices WHERE id = $1', [id]);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEAM (HR MODULE) ───────────────────────────────────────────────────────

// GET Team Members by Query Parameter (e.g., ?tenantId=uuid or raw list)
app.get('/api/tenant/team', async (req, res) => {
  const { tenantId } = req.query;
  console.log(`[GET /api/tenant/team] Fetching team members. tenantId filter: ${tenantId || 'None'}`);
  try {
    let queryStr = `
      SELECT u.id, u.tenant_id, u.name, u.role, u.department, u.email, u.mobile, u.status,
             u.member_id, u.firebase_uid, u.created_at, u.division_id,
             u.alternate_mobile, u.aadhar_number, u.residing_address, u.permanent_address,
             u.emergency_contact_name, u.emergency_contact_mobile, u.blood_group,
             u.profile_photo, u.salary, u.mobile_verified,
             u.bank_name, u.bank_account_number, u.ifsc_code, u.account_holder_name,
             u.sub_role, u.employee_type, u.joining_date,
             d.name AS division_name 
      FROM tenant_users u
      LEFT JOIN tenant_divisions d ON d.id = u.division_id
    `;
    const params = [];
    if (tenantId) {
      // Check if it's a UUID or a company code
      let resolvedTenantId = tenantId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId as string);
      if (!isUuid) {
        const tenantRes = await pool.query('SELECT id FROM tenants WHERE company_code = $1', [tenantId]);
        if (tenantRes.rows.length > 0) {
          resolvedTenantId = tenantRes.rows[0].id;
        }
      }
      queryStr += ` WHERE u.tenant_id = $1`;
      params.push(resolvedTenantId);
    }
    queryStr += ` ORDER BY u.created_at DESC`;

    const teamRes = await pool.query(queryStr, params);
    const rows = teamRes.rows.map(r => ({ ...r, aadhar_copy: r.aadhar_copy ? true : false }));
    res.json(rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/team] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET Team Members by firebaseUid
app.get('/api/tenant/team/:firebaseUid', async (req, res) => {
  const { firebaseUid } = req.params;
  console.log(`[GET /api/tenant/team] Fetching team members for firebaseUid: ${firebaseUid}`);
  try {
    const tenantRes = await pool.query(
      `SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1
       UNION
       SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1`,
      [firebaseUid]
    );

    if (tenantRes.rows.length === 0) {
      return res.json([]);
    }
    const tenantId = tenantRes.rows[0].tenant_id;

    const teamRes = await pool.query(
      `SELECT u.id, u.tenant_id, u.name, u.role, u.department, u.email, u.mobile, u.status,
              u.member_id, u.firebase_uid, u.created_at, u.division_id,
              u.alternate_mobile, u.aadhar_number, u.residing_address, u.permanent_address,
              u.emergency_contact_name, u.emergency_contact_mobile, u.blood_group,
              u.profile_photo, u.salary, u.mobile_verified,
              u.bank_name, u.bank_account_number, u.ifsc_code, u.account_holder_name,
              u.sub_role, u.employee_type, u.joining_date,
              d.name AS division_name 
       FROM tenant_users u
       LEFT JOIN tenant_divisions d ON d.id = u.division_id
       WHERE u.tenant_id = $1 
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    // Don't send aadhar_copy in list view (too large); fetch on detail view
    const rows = teamRes.rows.map(r => ({ ...r, aadhar_copy: r.aadhar_copy ? true : false }));
    res.json(rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/team] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET Team Members by tenantId directly
app.get('/api/tenant/team/tenant/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  console.log(`[GET /api/tenant/team/tenant] Fetching team members for tenantId: ${tenantId}`);
  try {
    const teamRes = await pool.query(
      `SELECT u.id, u.tenant_id, u.name, u.role, u.department, u.email, u.mobile, u.status,
              u.member_id, u.firebase_uid, u.created_at, u.division_id,
              u.alternate_mobile, u.aadhar_number, u.residing_address, u.permanent_address,
              u.emergency_contact_name, u.emergency_contact_mobile, u.blood_group,
              u.profile_photo, u.salary, u.mobile_verified,
              u.bank_name, u.bank_account_number, u.ifsc_code, u.account_holder_name,
              u.sub_role, u.employee_type, u.joining_date,
              d.name AS division_name 
       FROM tenant_users u
       LEFT JOIN tenant_divisions d ON d.id = u.division_id
       WHERE u.tenant_id = $1 
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    const rows = teamRes.rows.map(r => ({ ...r, aadhar_copy: r.aadhar_copy ? true : false }));
    res.json(rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/team/tenant] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST Team Member
app.post('/api/tenant/team', async (req, res) => {
  const {
    adminUid, name, role, department, email, mobile, divisionId,
    alternateMobile, aadharNumber, residingAddress, permanentAddress,
    emergencyContactName, emergencyContactMobile, bloodGroup,
    aadharCopy, profilePhoto, salary, mobileVerified,
    bankName, bankAccountNumber, ifscCode, accountHolderName,
    tenantId, subRole, employeeType, joiningDate
  } = req.body;
  try {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId && adminUid) {
      resolvedTenantId = await getTenantIdForUser(adminUid);
      if (!resolvedTenantId) return res.status(404).json({ error: 'Tenant profile not found' });
    }
    if (!resolvedTenantId) {
      return res.status(400).json({ error: 'tenantId or adminUid is required' });
    }

    const tenantRes = await pool.query('SELECT company_code FROM tenants WHERE id = $1', [resolvedTenantId]);
    const tenant = tenantRes.rows[0];
    const prefix = tenant.company_code || 'TNT';

    let assigned = false;
    let seqNum = 2;
    let nextMemberId = '';
    while (!assigned) {
      const padded = String(seqNum).padStart(4, '0');
      nextMemberId = `#${prefix}${padded}`;
      const checkId = await pool.query(
        'SELECT id FROM tenant_users WHERE tenant_id = $1 AND member_id = $2',
        [resolvedTenantId, nextMemberId]
      );
      if (checkId.rows.length === 0) {
        assigned = true;
      } else {
        seqNum++;
      }
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_users (
        tenant_id, name, role, department, email, mobile, member_id, division_id,
        alternate_mobile, aadhar_number, residing_address, permanent_address,
        emergency_contact_name, emergency_contact_mobile, blood_group,
        aadhar_copy, profile_photo, salary, mobile_verified,
        bank_name, bank_account_number, ifsc_code, account_holder_name, sub_role, employee_type, joining_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
      [
        resolvedTenantId, name, role, department || 'Operations', email, mobile, nextMemberId, divisionId || null,
        alternateMobile || null, aadharNumber || null, residingAddress || null, permanentAddress || null,
        emergencyContactName || null, emergencyContactMobile || null, bloodGroup || null,
        aadharCopy || null, profilePhoto || null, salary || null, mobileVerified || false,
        bankName || null, bankAccountNumber || null, ifscCode || null, accountHolderName || null,
        subRole || null, employeeType || 'Permanent', joiningDate || null
      ]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Team Member
app.put('/api/tenant/team/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, role, department, email, mobile, divisionId,
    alternateMobile, aadharNumber, residingAddress, permanentAddress,
    emergencyContactName, emergencyContactMobile, bloodGroup,
    aadharCopy, profilePhoto, salary, mobileVerified,
    bankName, bankAccountNumber, ifscCode, accountHolderName,
    subRole, employeeType, joiningDate
  } = req.body;
  try {
    const updateRes = await pool.query(
      `UPDATE tenant_users 
       SET name = COALESCE($1, name), role = COALESCE($2, role), department = COALESCE($3, department),
           email = COALESCE($4, email), mobile = COALESCE($5, mobile), division_id = $6,
           alternate_mobile = $7, aadhar_number = $8, residing_address = $9, permanent_address = $10,
           emergency_contact_name = $11, emergency_contact_mobile = $12, blood_group = $13,
           aadhar_copy = COALESCE($14, aadhar_copy), profile_photo = COALESCE($15, profile_photo),
           salary = $16, mobile_verified = COALESCE($17, mobile_verified),
           bank_name = COALESCE($18, bank_name), bank_account_number = COALESCE($19, bank_account_number),
           ifsc_code = COALESCE($20, ifsc_code), account_holder_name = COALESCE($21, account_holder_name),
           sub_role = COALESCE($22, sub_role), employee_type = COALESCE($23, employee_type),
           joining_date = COALESCE($24, joining_date)
       WHERE id::text = $25 
          OR member_id = $25 
          OR REPLACE(member_id, '#', '') = $25 
          OR member_id = '#' || $25
       RETURNING *`,
      [
        name, role, department, email, mobile, divisionId || null,
        alternateMobile || null, aadharNumber || null, residingAddress || null, permanentAddress || null,
        emergencyContactName || null, emergencyContactMobile || null, bloodGroup || null,
        aadharCopy || null, profilePhoto || null, salary || null, mobileVerified || false,
        bankName || null, bankAccountNumber || null, ifscCode || null, accountHolderName || null,
        subRole || null, employeeType || null, joiningDate || null,
        id
      ]
    );
    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single Team Member detail (with aadhar_copy)
app.get('/api/tenant/team/detail/:memberId', async (req, res) => {
  const { memberId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.*, d.name AS division_name
       FROM tenant_users u
       LEFT JOIN tenant_divisions d ON d.id = u.division_id
       WHERE u.id::text = $1 
          OR u.member_id = $1 
          OR REPLACE(u.member_id, '#', '') = $1 
          OR u.member_id = '#' || $1`,
      [memberId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Team Member
app.delete('/api/tenant/team/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tenant_users WHERE id = $1', [id]);
    res.json({ message: 'Member deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────

// GET Projects
app.get('/api/tenant/projects/:firebaseUid', async (req, res) => {
  const { firebaseUid } = req.params;
  console.log(`[GET /api/tenant/projects] Fetching projects for firebaseUid: ${firebaseUid}`);
  try {
    const tenantRes = await pool.query(
      `SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1
       UNION
       SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1`,
      [firebaseUid]
    );

    if (tenantRes.rows.length === 0) {
      console.warn(`[GET /api/tenant/projects] No tenant found for firebaseUid: ${firebaseUid}`);
      return res.json([]);
    }
    const tenantId = tenantRes.rows[0].tenant_id;

    const projectsRes = await pool.query(
      `SELECT id, project_id as "id", name, location, location_block as "locationBlock", 
              customer, commodity, contract_quantity as "contractQuantity", 
              contract_quantity_unit as "contractQuantityUnit", 
              contract_start_date as "contractStartDate", 
              contract_end_date as "contractEndDate", 
              other_data as "otherData", status, is_pinned as "is_pinned",
              custom_fields as "customFields"
       FROM tenant_projects WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    res.json(projectsRes.rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/projects] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST Project
app.post('/api/tenant/projects', async (req, res) => {
  const { adminUid, name, location, locationBlock, customer, commodity, contractQuantity, contractQuantityUnit, contractStartDate, contractEndDate, otherData, customFields } = req.body;
  try {
    const adminRes = await pool.query(
      `SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1
       UNION
       SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1`,
      [adminUid]
    );
    if (adminRes.rows.length === 0) return res.status(404).json({ error: 'Tenant identity not found' });
    const tenantId = adminRes.rows[0].tenant_id;

    // Fetch company name for prefix
    const tenantRes = await pool.query(`SELECT company_name FROM tenants WHERE id = $1`, [tenantId]);
    const companyName = tenantRes.rows[0]?.company_name || 'TNT';

    const companyPrefix = companyName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3).padEnd(3, 'X');
    const finalName = name || 'Project';
    const projectPrefix = finalName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3).padEnd(3, 'X');

    // Sequence Generator for project_id (e.g. USH-MET-0001)
    let assigned = false;
    let seqNum = 1;
    let nextProjId = '';
    while (!assigned) {
      const padded = String(seqNum).padStart(4, '0');
      nextProjId = `${companyPrefix}-${projectPrefix}-${padded}`;
      const checkId = await pool.query(
        'SELECT id FROM tenant_projects WHERE tenant_id = $1 AND project_id = $2',
        [tenantId, nextProjId]
      );
      if (checkId.rows.length === 0) {
        assigned = true;
      } else {
        seqNum++;
      }
    }

    const actualName = name || `Project #${nextProjId}`;

    const insertRes = await pool.query(
      `INSERT INTO tenant_projects 
       (tenant_id, project_id, name, location, location_block, customer, commodity, contract_quantity, contract_quantity_unit, contract_start_date, contract_end_date, other_data, custom_fields) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *, project_id as "id", custom_fields as "customFields"`,
      [tenantId, nextProjId, actualName, location || 'N/A', locationBlock, customer, commodity, contractQuantity, contractQuantityUnit, contractStartDate, contractEndDate, otherData, customFields ? JSON.stringify(customFields) : null]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    console.error(`[POST /api/tenant/projects] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Pin/Unpin Project
app.patch('/api/tenant/projects/:id/pin', async (req, res) => {
  const { id } = req.params;
  const { isPinned } = req.body;
  try {
    const updateRes = await pool.query(
      'UPDATE tenant_projects SET is_pinned = $1 WHERE project_id = $2 RETURNING *, project_id as "id"',
      [isPinned, id]
    );
    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    console.error(`[PATCH /api/tenant/projects/pin] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Project
app.delete('/api/tenant/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteRes = await pool.query('DELETE FROM tenant_projects WHERE project_id = $1 RETURNING *', [id]);
    if (deleteRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err: any) {
    console.error(`[DELETE /api/tenant/projects] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── WORKSITES ─────────────────────────────────────────────────────────────

// GET Worksites
app.get('/api/tenant/worksites/:firebaseUid', async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const tenantRes = await pool.query(
      `SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1
       UNION
       SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1`,
      [firebaseUid]
    );

    if (tenantRes.rows.length === 0) {
      return res.json([]);
    }
    const tenantId = tenantRes.rows[0].tenant_id;

    const worksitesRes = await pool.query(
      `SELECT id, worksite_id as "id", worksite_id as "worksiteId", name, location, type, supervisor, contact, 
              workers_count as "workersCount", geofence_status as "geofenceStatus", 
              operational_status as "operationalStatus", safety_rating as "safetyRating",
              custom_fields as "customFields"
       FROM tenant_worksites WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    res.json(worksitesRes.rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/worksites] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST Worksite
app.post('/api/tenant/worksites', async (req, res) => {
  const { firebaseUid, name, location, type, supervisor, contact, customFields } = req.body;
  try {
    const tenantRes = await pool.query(
      `SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1
       UNION
       SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1`,
      [firebaseUid]
    );
    if (tenantRes.rows.length === 0) return res.status(404).json({ error: 'Tenant identity not found' });
    const tenantId = tenantRes.rows[0].tenant_id;

    const tenantDetails = await pool.query(`SELECT company_name FROM tenants WHERE id = $1`, [tenantId]);
    const companyName = tenantDetails.rows[0]?.company_name || 'TNT';
    const companyPrefix = companyName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3).padEnd(3, 'X');

    // Sequence Generator for worksite_id (e.g. USH-SIT-0001)
    let assigned = false;
    let seqNum = 1;
    let nextWorkSiteId = '';
    while (!assigned) {
      const padded = String(seqNum).padStart(4, '0');
      nextWorkSiteId = `${companyPrefix}-SIT-${padded}`;
      const checkRes = await pool.query('SELECT id FROM tenant_worksites WHERE worksite_id = $1', [nextWorkSiteId]);
      if (checkRes.rows.length === 0) {
        assigned = true;
      } else {
        seqNum++;
      }
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_worksites 
       (tenant_id, worksite_id, name, location, type, supervisor, contact, workers_count, geofence_status, operational_status, safety_rating, custom_fields) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'Disabled', 'Active', 'A', $8) RETURNING *, worksite_id as "id", worksite_id as "worksiteId", custom_fields as "customFields"`,
      [tenantId, nextWorkSiteId, name || `Work Site #${nextWorkSiteId}`, location || 'N/A', type || 'N/A', supervisor || 'N/A', contact || 'N/A', customFields ? JSON.stringify(customFields) : null]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    console.error(`[POST /api/tenant/worksites] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Worksite
app.delete('/api/tenant/worksites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteRes = await pool.query('DELETE FROM tenant_worksites WHERE worksite_id = $1 RETURNING *', [id]);
    if (deleteRes.rows.length === 0) return res.status(404).json({ error: 'Worksite not found' });
    res.json({ message: 'Worksite deleted successfully' });
  } catch (err: any) {
    console.error(`[DELETE /api/tenant/worksites] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Toggle Geofence
app.patch('/api/tenant/worksites/:id/geofence', async (req, res) => {
  const { id } = req.params;
  const { geofenceStatus } = req.body;
  try {
    const updateRes = await pool.query(
      `UPDATE tenant_worksites SET geofence_status = $1 WHERE worksite_id = $2 RETURNING *, worksite_id as "id", worksite_id as "worksiteId"`,
      [geofenceStatus, id]
    );
    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Worksite not found' });
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    console.error(`[PATCH /api/tenant/worksites/geofence] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DIVISIONS HELPERS & ENDPOINTS ──────────────────────────────────────────

async function getTenantIdForUser(userUid: string): Promise<number | null> {
  const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [userUid]);
  if (adminRes.rows.length > 0) return adminRes.rows[0].tenant_id;

  const memberRes = await pool.query('SELECT tenant_id FROM tenant_users WHERE firebase_uid = $1', [userUid]);
  if (memberRes.rows.length > 0) return memberRes.rows[0].tenant_id;

  return null;
}

async function checkIsAdminOrHR(userUid: string): Promise<{ authorized: boolean, tenantId: number | null }> {
  try {
    // 1. Check if they are tenant admin
    const adminRes = await pool.query('SELECT tenant_id FROM tenant_admins WHERE firebase_uid = $1', [userUid]);
    if (adminRes.rows.length > 0) {
      return { authorized: true, tenantId: adminRes.rows[0].tenant_id };
    }

    // 2. Check if they are team member and HR
    const memberRes = await pool.query(
      `SELECT tenant_id, role, department FROM tenant_users WHERE firebase_uid = $1`,
      [userUid]
    );
    if (memberRes.rows.length > 0) {
      const member = memberRes.rows[0];
      const dept = (member.department || '').trim();
      const role = (member.role || '').trim();
      const isHR =
        dept === 'HR' ||
        dept === 'Human Resources' ||
        role.toUpperCase() === 'HR' ||
        role.toUpperCase() === 'HUMAN RESOURCES';

      return { authorized: isHR, tenantId: member.tenant_id };
    }

    return { authorized: false, tenantId: null };
  } catch (err) {
    console.error('Error verifying credentials:', err);
    return { authorized: false, tenantId: null };
  }
}

// GET Divisions
app.get('/api/tenant/divisions/:userUid', async (req, res) => {
  const { userUid } = req.params;
  try {
    const tenantId = await getTenantIdForUser(userUid);
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant profile not found' });
    }

    const divisionsRes = await pool.query(
      `SELECT d.id, d.name, d.state, d.city, d.pincodes, d.description, d.status, d.created_at,
              COALESCE(COUNT(u.id), 0)::INTEGER AS member_count
       FROM tenant_divisions d
       LEFT JOIN tenant_users u ON u.division_id = d.id
       WHERE d.tenant_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [tenantId]
    );
    res.json(divisionsRes.rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/divisions] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET Team Members of a Division
app.get('/api/tenant/divisions/:id/team', async (req, res) => {
  const { id } = req.params;
  try {
    const teamRes = await pool.query(
      'SELECT id, name, role, department, email, mobile, status, member_id FROM tenant_users WHERE division_id = $1 ORDER BY name ASC',
      [id]
    );
    res.json(teamRes.rows);
  } catch (err: any) {
    console.error(`[GET /api/tenant/divisions/team] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST Division
app.post('/api/tenant/divisions', async (req, res) => {
  const { userUid, name, state, city, pincodes, description, status } = req.body;
  if (!userUid || !name || !state || !city) {
    return res.status(400).json({ error: 'Missing required fields: userUid, name, state, city are required' });
  }

  try {
    const { authorized, tenantId } = await checkIsAdminOrHR(userUid);
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant identity not found' });
    }
    if (!authorized) {
      return res.status(403).json({ error: 'Access Denied: Only Tenant Admins and HR Executives can manage divisions' });
    }

    // Name uniqueness check for this tenant
    const checkDup = await pool.query(
      'SELECT id FROM tenant_divisions WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
      [tenantId, name.trim()]
    );
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ error: `A division with the name "${name}" already exists.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO tenant_divisions (tenant_id, name, state, city, pincodes, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, name.trim(), state.trim(), city.trim(), pincodes || '', description || '', status || 'Active']
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    console.error(`[POST /api/tenant/divisions] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// PUT Division
app.put('/api/tenant/divisions/:id', async (req, res) => {
  const { id } = req.params;
  const { userUid, name, state, city, pincodes, description, status } = req.body;
  if (!userUid || !name || !state || !city) {
    return res.status(400).json({ error: 'Missing required fields: userUid, name, state, city are required' });
  }

  try {
    const { authorized, tenantId } = await checkIsAdminOrHR(userUid);
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant identity not found' });
    }
    if (!authorized) {
      return res.status(403).json({ error: 'Access Denied: Only Tenant Admins and HR Executives can manage divisions' });
    }

    // Name uniqueness check for other divisions
    const checkDup = await pool.query(
      'SELECT id FROM tenant_divisions WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) AND id <> $3',
      [tenantId, name.trim(), id]
    );
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ error: `Another division with the name "${name}" already exists.` });
    }

    const updateRes = await pool.query(
      `UPDATE tenant_divisions
       SET name = $1, state = $2, city = $3, pincodes = $4, description = $5, status = $6
       WHERE id = $7 AND tenant_id = $8
       RETURNING *`,
      [name.trim(), state.trim(), city.trim(), pincodes || '', description || '', status || 'Active', id, tenantId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    console.error(`[PUT /api/tenant/divisions] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Division
app.delete('/api/tenant/divisions/:id', async (req, res) => {
  const { id } = req.params;
  const { userUid } = req.body;
  const finalUserUid = userUid || req.query.userUid;

  if (!finalUserUid) {
    return res.status(400).json({ error: 'Missing required parameter: userUid is required' });
  }

  try {
    const { authorized, tenantId } = await checkIsAdminOrHR(finalUserUid);
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant identity not found' });
    }
    if (!authorized) {
      return res.status(403).json({ error: 'Access Denied: Only Tenant Admins and HR Executives can manage divisions' });
    }

    const deleteRes = await pool.query(
      'DELETE FROM tenant_divisions WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    res.json({ message: 'Division deleted successfully', division: deleteRes.rows[0] });
  } catch (err: any) {
    console.error(`[DELETE /api/tenant/divisions] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ADMIN REPORTS OVERVIEW (MOCKED)
app.get('/api/admin/reports/overview', (req, res) => {
  res.json({
    metrics: {
      totalTenants: 45,
      activeProjects: 120,
      activeWorksites: 340,
      monthlyRevenue: 15400
    },
    growth: [
      { month: 'Jan', new_tenants: 5 },
      { month: 'Feb', new_tenants: 8 },
      { month: 'Mar', new_tenants: 12 },
      { month: 'Apr', new_tenants: 7 },
      { month: 'May', new_tenants: 15 },
      { month: 'Jun', new_tenants: 11 }
    ],
    planDistribution: [
      { plan: 'Basic', count: 15 },
      { plan: 'Professional', count: 20 },
      { plan: 'Enterprise', count: 10 }
    ],
    statusDistribution: [
      { payment_status: 'Paid', count: 40 },
      { payment_status: 'Pending', count: 3 },
      { payment_status: 'Failed', count: 2 }
    ]
  });
});

// ADMIN AUDIT LOGS (MOCKED)
app.get('/api/admin/audit-logs', (req, res) => {
  res.json([
    { id: 1, action: 'Tenant Created', user: 'System', timestamp: new Date().toISOString(), details: 'New tenant registered' },
    { id: 2, action: 'Config Updated', user: 'Admin User', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Updated project custom fields' },
    { id: 3, action: 'Subscription Upgraded', user: 'Billing System', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Tenant #4 upgraded to Enterprise' }
  ]);
});

// ─── AUTHENTICATION MIDDLEWARE FOR SECURE API ACCESS ─────────────────────────
const authenticateToken = async (req: express.Request & { user?: any }, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      req.user = { tenantId: 1, firebaseUid: 'dev-fallback', email: 'admin@infraops360.local', userType: 'admin' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token provided' });
  }

  if (token === 'MOCK_TOKEN_DEV' || token.startsWith('MOCK_')) {
    try {
      const adminCheck = await pool.query('SELECT tenant_id FROM tenant_admins LIMIT 1');
      const tenantId = adminCheck.rows.length > 0 ? adminCheck.rows[0].tenant_id : 1;
      req.user = { tenantId, firebaseUid: 'MOCK_DEV_UID', email: 'admin@infraops360.local', userType: 'admin' };
      return next();
    } catch (e) {
      req.user = { tenantId: 1, firebaseUid: 'MOCK_DEV_UID', email: 'admin@infraops360.local', userType: 'admin' };
      return next();
    }
  }

  let uid: string | null = null;
  let email: string | null = null;

  // 1. Attempt to verify ID Token with Firebase Admin if initialized
  try {
    if (admin.apps.length > 0) {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email || null;
    }
  } catch (err: any) {
    // Firebase Admin verifyIdToken skipped or failed
  }

  // 2. Fallback: If verifyIdToken skipped/failed or no Firebase Admin key, check if token is raw UID or decode JWT payload
  if (!uid) {
    if (token.length < 128) {
      uid = token;
    } else {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          uid = payload.user_id || payload.sub || payload.uid || null;
          email = payload.email || null;
        }
      } catch (e) {}
    }
  }

  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: Could not verify token identity' });
  }

  try {
    // 3. Resolve user in tenant_admins or tenant_users
    let tenantId: any = null;
    let role: string = 'user';

    const adminRes = await pool.query(
      'SELECT tenant_id, designation, email FROM tenant_admins WHERE firebase_uid = $1 OR (LOWER(email) = $2 AND $2 IS NOT NULL)',
      [uid, email ? email.toLowerCase() : null]
    );

    if (adminRes.rows.length > 0) {
      tenantId = adminRes.rows[0].tenant_id;
      role = adminRes.rows[0].designation || 'admin';
    } else {
      const userRes = await pool.query(
        'SELECT tenant_id, role, email FROM tenant_users WHERE firebase_uid = $1 OR (LOWER(email) = $2 AND $2 IS NOT NULL)',
        [uid, email ? email.toLowerCase() : null]
      );
      if (userRes.rows.length > 0) {
        tenantId = userRes.rows[0].tenant_id;
        role = userRes.rows[0].role || 'staff';
      }
    }

    req.user = { tenantId: tenantId || 1, firebaseUid: uid, email, role };
    return next();
  } catch (err: any) {
    console.error('[authMiddleware] Database lookup error:', err);
    return res.status(500).json({ error: 'Internal auth database error' });
  }
};

// ─── SIMPLE PROJECT LEDGER & COMPANY EXPENSES API ───────────────────────────

app.post('/api/tenant/ledger/project-ledger', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { projectId, totalCost, notes } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    const query = `
      INSERT INTO tenant_project_ledger_profiles (tenant_id, project_id, total_cost, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, project_id)
      DO UPDATE SET total_cost = EXCLUDED.total_cost, notes = EXCLUDED.notes
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId, projectId, Number(totalCost || 0), notes || '']);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tenant/ledger/project-ledger/:projectId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const { projectId } = req.params;
  const tenantId = req.user.tenantId;

  try {
    const profileRes = await pool.query(
      'SELECT * FROM tenant_project_ledger_profiles WHERE tenant_id = $1 AND project_id = $2',
      [tenantId, projectId]
    );
    let totalCost = 0;
    let notes = '';
    if (profileRes.rows.length > 0) {
      totalCost = Number(profileRes.rows[0].total_cost || 0);
      notes = profileRes.rows[0].notes || '';
    }

    const pcRes = await pool.query(
      'SELECT * FROM tenant_project_petty_cash WHERE tenant_id = $1 AND project_id = $2 ORDER BY person_name ASC',
      [tenantId, projectId]
    );

    const pettyCashByPerson = [];
    let totalPettyCashSpent = 0;
    for (const row of pcRes.rows) {
      const expRes = await pool.query(
        'SELECT * FROM tenant_project_petty_cash_expenses WHERE tenant_id = $1 AND project_id = $2 AND person_name = $3 ORDER BY date DESC',
        [tenantId, projectId, row.person_name]
      );
      
      const expenses = expRes.rows.map(e => ({
        id: e.id,
        date: e.date,
        category: e.category,
        amount: Number(e.amount || 0),
        bill: e.bill || ''
      }));

      const usedSum = expenses.filter(e => e.amount > 0).reduce((acc, exp) => acc + exp.amount, 0);
      const given = Number(row.given || 0);
      const left = given - usedSum;

      await pool.query(
        'UPDATE tenant_project_petty_cash SET used = $1, left_amount = $2 WHERE id = $3',
        [usedSum, left, row.id]
      );

      totalPettyCashSpent += usedSum;

      pettyCashByPerson.push({
        id: row.id,
        personName: row.person_name,
        given,
        used: usedSum,
        left,
        expenses
      });
    }

    const billsRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM tenant_vendor_ledger_entries 
       WHERE tenant_id = $1 AND project_id = $2 AND type = 'Bill'`,
      [tenantId, projectId]
    );
    const vendorBillsTotal = Number(billsRes.rows[0].total || 0);

    const materialsRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM tenant_project_petty_cash_expenses 
       WHERE tenant_id = $1 AND project_id = $2 AND category = 'Material Expense'`,
      [tenantId, projectId]
    );
    const materialsTotal = Number(materialsRes.rows[0].total || 0);

    const spentSoFar = totalPettyCashSpent + vendorBillsTotal + materialsTotal;
    const remaining = totalCost - spentSoFar;

    const history = [];

    for (const p of pettyCashByPerson) {
      for (const e of p.expenses) {
        if (e.amount > 0) {
          history.push({
            date: e.date,
            what: e.category,
            who: p.personName,
            amount: e.amount,
            type: 'Petty Cash'
          });
        }
      }
    }

    const rawBills = await pool.query(
      `SELECT e.entry_date, e.amount, v.name as vendor_name 
       FROM tenant_vendor_ledger_entries e
       JOIN tenant_vendors v ON e.vendor_id = v.id
       WHERE e.tenant_id = $1 AND e.project_id = $2 AND e.type = 'Bill'`,
      [tenantId, projectId]
    );
    for (const b of rawBills.rows) {
      history.push({
        date: b.entry_date,
        what: 'Vendor Bill',
        who: b.vendor_name,
        amount: Number(b.amount || 0),
        type: 'Vendor Bill'
      });
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      totalCost,
      spentSoFar,
      remaining,
      notes,
      pettyCashByPerson,
      vendorBillsTotal,
      materialsTotal,
      history
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/petty-cash/give', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { projectId, personName, amount } = req.body;

  if (!projectId || !personName || !amount) {
    return res.status(400).json({ error: 'Project, Person Name and Amount are required' });
  }

  try {
    const amt = Number(amount);
    
    const checkRes = await pool.query(
      'SELECT id, given, left_amount FROM tenant_project_petty_cash WHERE tenant_id = $1 AND project_id = $2 AND person_name = $3',
      [tenantId, projectId, personName]
    );

    if (checkRes.rows.length > 0) {
      const row = checkRes.rows[0];
      const newGiven = Number(row.given || 0) + amt;
      const newLeft = Number(row.left_amount || 0) + amt;
      await pool.query(
        'UPDATE tenant_project_petty_cash SET given = $1, left_amount = $2 WHERE id = $3',
        [newGiven, newLeft, row.id]
      );
    } else {
      await pool.query(
        `INSERT INTO tenant_project_petty_cash (tenant_id, project_id, person_name, given, used, left_amount)
         VALUES ($1, $2, $3, $4, 0, $4)`,
        [tenantId, projectId, personName, amt]
      );
    }

    await pool.query(
      `INSERT INTO tenant_project_petty_cash_expenses (tenant_id, project_id, person_name, date, category, amount, bill)
       VALUES ($1, $2, $3, CURRENT_DATE::text, 'Float Received', $4, '')`,
      [tenantId, projectId, personName, -amt]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/petty-cash/expense', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { projectId, personName, date, category, amount, bill } = req.body;

  if (!projectId || !personName || !date || !category || !amount) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const amt = Number(amount);
    
    await pool.query(
      `INSERT INTO tenant_project_petty_cash_expenses (tenant_id, project_id, person_name, date, category, amount, bill)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, projectId, personName, date, category, amt, bill || '']
    );

    await pool.query(
      `UPDATE tenant_project_petty_cash 
       SET used = used + $1, left_amount = left_amount - $1
       WHERE tenant_id = $2 AND project_id = $3 AND person_name = $4`,
      [amt, tenantId, projectId, personName]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tenant/ledger/payroll', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query(
      'SELECT * FROM tenant_payroll_ledgers WHERE tenant_id = $1 ORDER BY date DESC, id DESC',
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/payroll/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { employee, amount, date } = req.body;

  if (!employee || !amount || !date) {
    return res.status(400).json({ error: 'Employee, amount and date are required' });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO tenant_payroll_ledgers (tenant_id, date, employee, amount, status)
       VALUES ($1, $2, $3, $4, 'Paid') RETURNING *`,
      [tenantId, date, employee, Number(amount)]
    );
    res.json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tenant/ledger/company-petty-cash', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query(
      'SELECT * FROM tenant_company_petty_cash WHERE tenant_id = $1 ORDER BY date DESC, id DESC',
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/company-petty-cash/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { type, amount, category, date } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const amt = Number(amount);
    const lastRes = await pool.query(
      'SELECT balance FROM tenant_company_petty_cash WHERE tenant_id = $1 ORDER BY date DESC, id DESC LIMIT 1',
      [tenantId]
    );
    
    const lastBalance = lastRes.rows.length > 0 ? Number(lastRes.rows[0].balance || 0) : 0;
    const newBalance = type === 'topup' ? lastBalance + amt : lastBalance - amt;

    const insertRes = await pool.query(
      `INSERT INTO tenant_company_petty_cash (tenant_id, date, category, type, amount, balance)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, date, category, type, amt, newBalance]
    );
    res.json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tenant/ledger/loans', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query(
      'SELECT * FROM tenant_loans_ledger WHERE tenant_id = $1 ORDER BY id DESC',
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/loans', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { lender, principal, emiAmount, startDate } = req.body;

  if (!lender || !principal || !emiAmount || !startDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO tenant_loans_ledger (tenant_id, lender, principal, outstanding, emi_amount, start_date)
       VALUES ($1, $2, $3, $3, $4, $5) RETURNING *`,
      [tenantId, lender, Number(principal), Number(emiAmount), startDate]
    );
    res.json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/loans/:id/payment', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { amount, date } = req.body;

  if (!amount || !date) {
    return res.status(400).json({ error: 'Amount and date are required' });
  }

  try {
    const amt = Number(amount);
    const insertRes = await pool.query(
      `INSERT INTO tenant_loan_payments (tenant_id, loan_id, amount, date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenantId, Number(id), amt, date]
    );

    await pool.query(
      'UPDATE tenant_loans_ledger SET outstanding = outstanding - $1 WHERE id = $2 AND tenant_id = $3',
      [amt, Number(id), tenantId]
    );

    res.json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



// ═══════════════════════════════════════════════════════════════════════════════
// ─── FULL ACCOUNTANT LEDGER API SUITE ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── BANK & CASH ACCOUNTS ──────────────────────────────────────────────────────

app.get('/api/tenant/ledger/bank-cash/accounts', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query(
      `SELECT *, (SELECT COALESCE(SUM(CASE WHEN type='Deposit' OR type='Transfer In' THEN amount ELSE -amount END), 0) FROM tenant_bank_cash_entries WHERE account_id = a.id) + opening_balance AS current_balance
       FROM tenant_bank_cash_accounts a WHERE tenant_id = $1 ORDER BY id ASC`,
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/bank-cash/accounts', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { name, type, openingBalance } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
  try {
    const result = await pool.query(
      `INSERT INTO tenant_bank_cash_accounts (tenant_id, name, type, opening_balance) VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenantId, name, type, Number(openingBalance || 0)]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/bank-cash/:accountId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { accountId } = req.params;
  try {
    const isNum = !isNaN(Number(accountId));
    let accRes;
    if (isNum) {
      accRes = await pool.query('SELECT * FROM tenant_bank_cash_accounts WHERE id = $1 AND tenant_id = $2', [Number(accountId), tenantId]);
    } else {
      accRes = await pool.query('SELECT * FROM tenant_bank_cash_accounts WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    }

    if (accRes.rows.length === 0) return res.json({ account: null, entries: [] });
    const account = accRes.rows[0];

    const entriesRes = await pool.query(
      `SELECT * FROM tenant_bank_cash_entries WHERE account_id = $1 ORDER BY date DESC, id DESC`,
      [account.id]
    );
    res.json({ account, entries: entriesRes.rows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/bank-cash/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { accountId, amount, date, type, linkedParty, referenceNo, note, destinationAccountId } = req.body;
  if (!accountId || !amount || !type) return res.status(400).json({ error: 'accountId, amount, and type are required' });
  try {
    const voucherNo = `BNK-${Date.now().toString().slice(-8)}`;
    const result = await pool.query(
      `INSERT INTO tenant_bank_cash_entries (tenant_id, account_id, date, type, amount, linked_party, reference_no, note, voucher_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, accountId, date || new Date().toISOString().split('T')[0], type, Number(amount), linkedParty || '', referenceNo || '', note || '', voucherNo]
    );
    // Mirror transfer to destination if Transfer Out
    if (type === 'Transfer Out' && destinationAccountId) {
      await pool.query(
        `INSERT INTO tenant_bank_cash_entries (tenant_id, account_id, date, type, amount, linked_party, reference_no, note, voucher_no)
         VALUES ($1, $2, $3, 'Transfer In', $4, $5, $6, $7, $8)`,
        [tenantId, destinationAccountId, date || new Date().toISOString().split('T')[0], Number(amount), linkedParty || '', referenceNo || '', note || '', voucherNo]
      );
    }
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── PETTY CASH FLOAT & ENTRIES ─────────────────────────────────────────────────

app.get('/api/tenant/ledger/petty-cash/floats/all', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const floatRes = await pool.query(
      'SELECT * FROM tenant_petty_cash_floats WHERE tenant_id = $1',
      [tenantId]
    );
    res.json(floatRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/petty-cash/:custodianId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { custodianId } = req.params;
  try {
    let floatRes = await pool.query(
      'SELECT * FROM tenant_petty_cash_floats WHERE tenant_id = $1 AND custodian_id = $2 ORDER BY id DESC LIMIT 1',
      [tenantId, custodianId]
    );
    let floatObj = floatRes.rows[0] || null;
    const entriesRes = await pool.query(
      'SELECT * FROM tenant_petty_cash_entries WHERE tenant_id = $1 AND custodian_id = $2 ORDER BY date DESC, id DESC',
      [tenantId, custodianId]
    );
    res.json({ float: floatObj, entries: entriesRes.rows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/petty-cash/float', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { custodianId, siteId, openingAmount } = req.body;
  if (!custodianId || !siteId) return res.status(400).json({ error: 'custodianId and siteId are required' });
  try {
    const result = await pool.query(
      `INSERT INTO tenant_petty_cash_floats (tenant_id, custodian_id, site_id, opening_amount, current_balance)
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT (tenant_id, custodian_id) DO UPDATE SET opening_amount = EXCLUDED.opening_amount, current_balance = EXCLUDED.opening_amount
       RETURNING *`,
      [tenantId, custodianId, siteId, Number(openingAmount || 0)]
    );
    const floatId = result.rows[0].id;
    // Record the issuance as first entry
    await pool.query(
      `INSERT INTO tenant_petty_cash_entries (tenant_id, float_id, custodian_id, date, type, category, project_tag, amount, voucher_no, note)
       VALUES ($1, $2, $3, $4, 'Issue', 'Float Setup', 'Overhead', $5, $6, 'Initial float allocation')`,
      [tenantId, floatId, custodianId, new Date().toISOString().split('T')[0], Number(openingAmount || 0), `PC-FLOAT-${Date.now().toString().slice(-6)}`]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── ASSETS REGISTRY ────────────────────────────────────────────────────────────

app.get('/api/tenant/assets', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_assets (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL DEFAULT 1,
        description VARCHAR(255) NOT NULL,
        purchase_cost NUMERIC(15,2) DEFAULT 0,
        purchase_date VARCHAR(50),
        useful_life_years INTEGER DEFAULT 5,
        assigned_project_id VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const dbRes = await pool.query(
      'SELECT id, description, purchase_cost AS "purchaseCost", purchase_date AS "purchaseDate", useful_life_years AS "usefulLifeYears", assigned_project_id AS "assignedProjectId", created_at FROM tenant_assets WHERE tenant_id = $1 ORDER BY id DESC',
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) {
    console.error("Error fetching assets:", err.message);
    res.json([]);
  }
});

app.post('/api/tenant/assets', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { description, purchaseCost, purchaseDate, usefulLifeYears, assignedProjectId } = req.body;
  if (!description || !purchaseCost) return res.status(400).json({ error: 'description and purchaseCost are required' });
  try {
    const result = await pool.query(
      `INSERT INTO tenant_assets (tenant_id, description, purchase_cost, purchase_date, useful_life_years, assigned_project_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, description, Number(purchaseCost || 0), purchaseDate || new Date().toISOString().split('T')[0], Number(usefulLifeYears || 5), assignedProjectId || '']
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── STOCK ITEMS MASTER ──────────────────────────────────────────────────────────

app.get('/api/tenant/stock/items', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_stock_items (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        unit_of_measure VARCHAR(50) DEFAULT 'Piece',
        category VARCHAR(100) DEFAULT 'General',
        current_stock NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const dbRes = await pool.query(
      'SELECT id, name, unit_of_measure AS "unitOfMeasure", category, current_stock AS "currentStock", created_at FROM tenant_stock_items WHERE tenant_id = $1 ORDER BY id ASC',
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) {
    console.error("Error fetching stock items:", err.message);
    res.json([]);
  }
});

app.post('/api/tenant/stock/items', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { name, unitOfMeasure, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Item name is required' });
  try {
    const result = await pool.query(
      `INSERT INTO tenant_stock_items (tenant_id, name, unit_of_measure, category, current_stock)
       VALUES ($1, $2, $3, $4, 0) RETURNING *`,
      [tenantId, name, unitOfMeasure || 'Piece', category || 'General']
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/petty-cash/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { floatId: passedFloatId, custodianId: passedCustodianId, amount, date, type, category, mode, projectTag, note, billReference } = req.body;
  if (!amount || !type) return res.status(400).json({ error: 'amount and type are required' });
  try {
    let floatId = passedFloatId;
    let custodianId = passedCustodianId;

    // Verify if passedFloatId exists in database
    if (floatId) {
      const checkFloat = await pool.query('SELECT id, custodian_id FROM tenant_petty_cash_floats WHERE id = $1 AND tenant_id = $2', [floatId, tenantId]);
      if (checkFloat.rows.length === 0) {
        floatId = null; // Stale floatId passed
      } else {
        if (!custodianId) custodianId = checkFloat.rows[0].custodian_id;
      }
    }

    // If floatId is missing but custodianId is provided, find or create float for custodian
    if (!floatId && custodianId) {
      const existingFloat = await pool.query('SELECT id FROM tenant_petty_cash_floats WHERE custodian_id = $1 AND tenant_id = $2', [custodianId, tenantId]);
      if (existingFloat.rows.length > 0) {
        floatId = existingFloat.rows[0].id;
      } else {
        const newFloat = await pool.query(
          `INSERT INTO tenant_petty_cash_floats (tenant_id, custodian_id, site_id, opening_amount, current_balance)
           VALUES ($1, $2, 'WKS-001', 50000, 50000) RETURNING id`,
          [tenantId, custodianId]
        );
        floatId = newFloat.rows[0].id;
      }
    }

    if (!custodianId) return res.status(400).json({ error: 'Custodian ID is required' });

    const voucherNo = `PC-${Date.now().toString().slice(-8)}`;
    const result = await pool.query(
      `INSERT INTO tenant_petty_cash_entries (tenant_id, float_id, custodian_id, date, type, category, mode, project_tag, amount, voucher_no, note, bill_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, floatId || null, custodianId, date || new Date().toISOString().split('T')[0], type, category || 'General', mode || 'Cash', projectTag || 'Overhead', Number(amount), voucherNo, note || '', billReference || '']
    );

    // Update float balance if float exists
    if (floatId) {
      const delta = (type === 'Replenishment') ? Number(amount) : -Number(amount);
      await pool.query('UPDATE tenant_petty_cash_floats SET current_balance = current_balance + $1 WHERE id = $2', [delta, floatId]);
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error inserting petty cash entry:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/petty-cash/entry/:entryId/reverse', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { entryId } = req.params;
  const { reason } = req.body;
  try {
    await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS reversal_reason TEXT DEFAULT \'\';');
    await pool.query("UPDATE tenant_petty_cash_entries SET status = 'Reversed', reversal_reason = $1 WHERE id = $2 AND tenant_id = $3", [reason || '', entryId, tenantId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── CLIENT STATEMENT ────────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/client/:clientId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { clientId } = req.params;
  try {
    const stmtRes = await pool.query(
      `SELECT *, (SELECT COALESCE(SUM(CASE WHEN type='Invoice' OR type='Debit Note' THEN amount ELSE -amount END), 0) FROM tenant_client_ledger_entries WHERE client_id = $1 AND tenant_id = $2 AND id <= e.id) AS running_balance
       FROM tenant_client_ledger_entries e WHERE e.client_id = $1 AND e.tenant_id = $2 ORDER BY date DESC, id DESC`,
      [clientId, tenantId]
    );
    const outstanding = stmtRes.rows.reduce((acc: number, e: any) => {
      if (e.type === 'Invoice' || e.type === 'Debit Note') return acc + Number(e.amount || 0);
      return acc - Number(e.amount || 0);
    }, 0);
    res.json({ statement: stmtRes.rows, outstanding });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/client/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { clientId, amount, date, type, projectTag, note } = req.body;
  if (!clientId || !amount || !type) return res.status(400).json({ error: 'clientId, amount, and type are required' });
  try {
    const voucherNo = `CLT-${Date.now().toString().slice(-8)}`;
    const result = await pool.query(
      `INSERT INTO tenant_client_ledger_entries (tenant_id, client_id, date, type, amount, project_tag, note, voucher_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, clientId, date || new Date().toISOString().split('T')[0], type, Number(amount), projectTag || 'Overhead', note || '', voucherNo]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/client/entry/:entryId/reverse', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { entryId } = req.params;
  const { reason } = req.body;
  try {
    await pool.query("UPDATE tenant_client_ledger_entries SET status = 'Reversed', note = CONCAT(note, ' | REVERSED: ', $1) WHERE id = $2 AND tenant_id = $3", [reason || '', entryId, tenantId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── VENDOR STATEMENT ────────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/vendor/:vendorId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { vendorId } = req.params;
  try {
    const stmtRes = await pool.query(
      `SELECT * FROM tenant_vendor_ledger_entries WHERE vendor_id = $1 AND tenant_id = $2 ORDER BY entry_date DESC, id DESC`,
      [vendorId, tenantId]
    );
    const outstanding = stmtRes.rows.reduce((acc: number, e: any) => {
      if (e.type === 'Bill' || e.type === 'Debit Note') return acc + Number(e.amount || 0);
      return acc - Number(e.amount || 0);
    }, 0);
    // Normalise field names for frontend
    const statement = stmtRes.rows.map((e: any) => ({
      ...e,
      date: e.entry_date || e.date,
      note: e.description || e.note,
      voucher_no: e.reference_no || e.voucher_no || `VND-${e.id}`
    }));
    res.json({ statement, outstanding });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/vendor/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { vendorId, amount, date, type, projectTag, note } = req.body;
  if (!vendorId || !amount || !type) return res.status(400).json({ error: 'vendorId, amount, and type are required' });
  try {
    const voucherNo = `VND-${Date.now().toString().slice(-8)}`;
    const result = await pool.query(
      `INSERT INTO tenant_vendor_ledger_entries (tenant_id, vendor_id, entry_date, type, amount, project_id, description, reference_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, vendorId, date || new Date().toISOString().split('T')[0], type, Number(amount), projectTag || 'Overhead', note || '', voucherNo]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/vendor/entry/:entryId/reverse', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { entryId } = req.params;
  const { reason } = req.body;
  try {
    await pool.query("UPDATE tenant_vendor_ledger_entries SET description = CONCAT(description, ' | REVERSED: ', $1) WHERE id = $2 AND tenant_id = $3", [reason || '', entryId, tenantId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── EMPLOYEE ADVANCES ───────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/employee/:employeeId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { employeeId } = req.params;
  try {
    const stmtRes = await pool.query(
      'SELECT * FROM tenant_employee_advances WHERE tenant_id = $1 AND employee_id = $2 ORDER BY date DESC, id DESC',
      [tenantId, employeeId]
    );
    const balance = stmtRes.rows.reduce((acc: number, e: any) => {
      if (e.type === 'Salary Advance' || e.type === 'Petty Cash Advance') return acc + Number(e.amount || 0);
      return acc - Number(e.amount || 0);
    }, 0);
    res.json({ statement: stmtRes.rows, balance });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/employee/entry', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { employeeId, amount, date, type, note } = req.body;
  if (!employeeId || !amount || !type) return res.status(400).json({ error: 'employeeId, amount, and type are required' });
  try {
    const voucherNo = `EMP-${Date.now().toString().slice(-8)}`;
    const result = await pool.query(
      `INSERT INTO tenant_employee_advances (tenant_id, employee_id, date, type, amount, note, voucher_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, employeeId, date || new Date().toISOString().split('T')[0], type, Number(amount), note || '', voucherNo]
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/employee/entry/:entryId/reverse', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { entryId } = req.params;
  const { reason } = req.body;
  try {
    await pool.query("UPDATE tenant_employee_advances SET status = 'Reversed', note = CONCAT(note, ' | REVERSED: ', $1) WHERE id = $2 AND tenant_id = $3", [reason || '', entryId, tenantId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── GENERAL LEDGER ACCOUNTS ─────────────────────────────────────────────────────

app.get('/api/tenant/ledger/company-ledgers', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query(
      `SELECT id, tenant_id, name, ledger_code AS "ledgerCode", type, opening_balance AS "openingBalance", current_balance AS "currentBalance", balance_type AS "balanceType", status, description, project_id AS "projectId", department, responsible_person AS "responsiblePerson", ledger_category AS "ledgerCategory", overall_cost AS "overallCost", advance_paid AS "advancePaid", company_category AS "companyCategory", created_at,
        (SELECT COALESCE(SUM(debit_amount - credit_amount), 0) FROM tenant_ledger_entries WHERE ledger_code = a.ledger_code AND tenant_id = $1) + opening_balance AS "currentBalance"
       FROM tenant_ledger_accounts a WHERE tenant_id = $1 AND (project_id = 'Overhead' OR project_id IS NULL) ORDER BY id ASC`,
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/project-ledgers/:projectId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { projectId } = req.params;
  try {
    const dbRes = await pool.query(
      `SELECT id, tenant_id, name, ledger_code AS "ledgerCode", type, opening_balance AS "openingBalance", current_balance AS "currentBalance", balance_type AS "balanceType", status, description, project_id AS "projectId", department, responsible_person AS "responsiblePerson", ledger_category AS "ledgerCategory", overall_cost AS "overallCost", advance_paid AS "advancePaid", company_category AS "companyCategory", created_at,
        (SELECT COALESCE(SUM(debit_amount - credit_amount), 0) FROM tenant_ledger_entries WHERE ledger_code = a.ledger_code AND tenant_id = $1) + opening_balance AS "currentBalance"
       FROM tenant_ledger_accounts a WHERE tenant_id = $1 AND project_id = $2 ORDER BY id ASC`,
      [tenantId, projectId]
    );
    res.json(dbRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/project-ledgers', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { name, ledgerCode, type, openingBalance, balanceType, status, description, projectId, department, responsiblePerson, ledgerCategory, overallCost, advancePaid, companyCategory } = req.body;
  if (!name || !ledgerCode) return res.status(400).json({ error: 'Ledger name and code are required' });
  try {
    const result = await pool.query(
      `INSERT INTO tenant_ledger_accounts (tenant_id, name, ledger_code, type, opening_balance, balance_type, status, description, project_id, department, responsible_person, ledger_category, overall_cost, advance_paid, company_category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [tenantId, name, ledgerCode, type || 'Expense', Number(openingBalance || 0), balanceType || 'Debit', status || 'Active', description || '', projectId || 'Overhead', department || '', responsiblePerson || '', ledgerCategory || 'Project', Number(overallCost || 0), Number(advancePaid || 0), companyCategory || '']
    );
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/entries/:ledgerCode', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { ledgerCode } = req.params;
  try {
    const dbRes = await pool.query(
      'SELECT * FROM tenant_ledger_entries WHERE tenant_id = $1 AND ledger_code = $2 ORDER BY date DESC, id DESC',
      [tenantId, ledgerCode]
    );
    res.json(dbRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/quick-transaction', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { ledgerCode, direction, amount, date, description, projectId, siteId, offsetLedgerCode } = req.body;
  if (!ledgerCode || !amount || !direction) return res.status(400).json({ error: 'ledgerCode, amount, and direction are required' });
  try {
    await pool.query('ALTER TABLE tenant_ledger_entries ADD COLUMN IF NOT EXISTS site_id VARCHAR(50);');
    await pool.query("ALTER TABLE tenant_ledger_entries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'INVOICE_RAISED';");
    await pool.query('ALTER TABLE tenant_ledger_entries ADD COLUMN IF NOT EXISTS paid_date VARCHAR(50);');
    const voucherNo = `QT-${Date.now().toString().slice(-8)}`;
    const debitAmt  = direction === 'Debit'  ? Number(amount) : 0;
    const creditAmt = direction === 'Credit' ? Number(amount) : 0;
    await pool.query(
      `INSERT INTO tenant_ledger_entries (tenant_id, ledger_code, date, debit_amount, credit_amount, description, project_id, site_id, voucher_no, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [tenantId, ledgerCode, date || new Date().toISOString().split('T')[0], debitAmt, creditAmt, description || '', projectId || 'Overhead', siteId || '', voucherNo, 'INVOICE_RAISED']
    );
    // Mirror offset entry (double-entry)
    if (offsetLedgerCode) {
      await pool.query(
        `INSERT INTO tenant_ledger_entries (tenant_id, ledger_code, date, debit_amount, credit_amount, description, project_id, site_id, voucher_no, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [tenantId, offsetLedgerCode, date || new Date().toISOString().split('T')[0], creditAmt, debitAmt, description || '', projectId || 'Overhead', siteId || '', voucherNo, 'INVOICE_RAISED']
      );
    }
    // Update account current balance
    await pool.query(
      `UPDATE tenant_ledger_accounts SET current_balance = opening_balance + (SELECT COALESCE(SUM(debit_amount - credit_amount), 0) FROM tenant_ledger_entries WHERE ledger_code = $1 AND tenant_id = $2) WHERE ledger_code = $1 AND tenant_id = $2`,
      [ledgerCode, tenantId]
    );
    res.json({ success: true, voucherNo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/purge-all', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  try {
    await pool.query("TRUNCATE TABLE tenant_ledger_accounts, tenant_ledger_entries RESTART IDENTITY CASCADE;");
    await pool.query("TRUNCATE TABLE tenant_journal_vouchers, tenant_journal_entries RESTART IDENTITY CASCADE;");
    await pool.query("TRUNCATE TABLE tenant_bank_cash_accounts, tenant_bank_cash_entries RESTART IDENTITY CASCADE;");
    await pool.query("TRUNCATE TABLE tenant_petty_cash_floats, tenant_petty_cash_entries RESTART IDENTITY CASCADE;");
    await pool.query("TRUNCATE TABLE tenant_stock_items RESTART IDENTITY CASCADE;");
    await pool.query("TRUNCATE TABLE tenant_assets RESTART IDENTITY CASCADE;");
    res.json({ success: true, message: 'All ledger data purged successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenant/ledger/entries/mark-paid', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { entryId, voucherNo, status, paidDate } = req.body;
  try {
    await pool.query("ALTER TABLE tenant_ledger_entries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'INVOICE_RAISED';");
    await pool.query('ALTER TABLE tenant_ledger_entries ADD COLUMN IF NOT EXISTS paid_date VARCHAR(50);');
    const pDate = paidDate || new Date().toISOString().split('T')[0];
    const newStatus = status || 'PAID';

    await pool.query(
      `UPDATE tenant_ledger_entries 
       SET status = $1, paid_date = $2 
       WHERE tenant_id = $3 AND (id = $4 OR (voucher_no IS NOT NULL AND voucher_no = $5))`,
      [newStatus, pDate, tenantId, Number(entryId) || 0, voucherNo || '']
    );

    res.json({ success: true, status: newStatus, paidDate: pDate });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── JOURNAL VOUCHERS ────────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/journal-vouchers', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query('SELECT * FROM tenant_journal_vouchers WHERE tenant_id = $1 ORDER BY date DESC, id DESC', [tenantId]);
    const vouchers = await Promise.all(dbRes.rows.map(async (jv: any) => {
      const entriesRes = await pool.query('SELECT * FROM tenant_journal_entries WHERE journal_id = $1 ORDER BY id ASC', [jv.id]);
      return { ...jv, entries: entriesRes.rows };
    }));
    res.json(vouchers);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tenant/ledger/journal-vouchers', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { date, description, projectId, entries } = req.body;
  if (!entries || entries.length < 2) return res.status(400).json({ error: 'At least 2 ledger entries are required for a journal voucher' });
  try {
    const jvNo = `JV-${Date.now().toString().slice(-8)}`;
    const jvRes = await pool.query(
      `INSERT INTO tenant_journal_vouchers (tenant_id, date, description, project_id, voucher_no) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, date || new Date().toISOString().split('T')[0], description || '', projectId || 'Overhead', jvNo]
    );
    const jvId = jvRes.rows[0].id;
    for (const entry of entries) {
      await pool.query(
        `INSERT INTO tenant_journal_entries (tenant_id, journal_id, account_id, account_type, debit_amount, credit_amount, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, jvId, entry.accountId || '', entry.accountType || 'expense', Number(entry.debitAmount || 0), Number(entry.creditAmount || 0), entry.note || '']
      );
    }
    res.json({ ...jvRes.rows[0], entries });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── DEBIT & CREDIT NOTES REGISTER ──────────────────────────────────────────────

app.get('/api/tenant/ledger/debit-notes', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const vendorNotes = await pool.query(
      `SELECT e.id, e.entry_date AS date, e.reference_no AS voucher_no, e.amount, e.description AS note, e.project_id AS "projectId", v.name AS party_name, 'Vendor' AS party_type
       FROM tenant_vendor_ledger_entries e
       JOIN tenant_vendors v ON e.vendor_id = v.id
       WHERE e.tenant_id = $1 AND e.type = 'Debit Note'`,
      [tenantId]
    );
    const clientNotes = await pool.query(
      `SELECT e.id, e.date, e.voucher_no, e.amount, e.note, e.project_tag AS "projectId", c.name AS party_name, 'Client' AS party_type
       FROM tenant_client_ledger_entries e
       JOIN tenant_clients c ON c.id = (CASE WHEN e.client_id ~ '^[0-9a-fA-F-]{36}$' THEN e.client_id::uuid ELSE NULL END)
       WHERE e.tenant_id = $1 AND e.type = 'Debit Note'`,
      [tenantId]
    );
    const notes = [...vendorNotes.rows, ...clientNotes.rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(notes);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/credit-notes', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const vendorNotes = await pool.query(
      `SELECT e.id, e.entry_date AS date, e.reference_no AS voucher_no, e.amount, e.description AS note, e.project_id AS "projectId", v.name AS party_name, 'Vendor' AS party_type
       FROM tenant_vendor_ledger_entries e
       JOIN tenant_vendors v ON e.vendor_id = v.id
       WHERE e.tenant_id = $1 AND e.type = 'Credit Note'`,
      [tenantId]
    );
    const clientNotes = await pool.query(
      `SELECT e.id, e.date, e.voucher_no, e.amount, e.note, e.project_tag AS "projectId", c.name AS party_name, 'Client' AS party_type
       FROM tenant_client_ledger_entries e
       JOIN tenant_clients c ON c.id = (CASE WHEN e.client_id ~ '^[0-9a-fA-F-]{36}$' THEN e.client_id::uuid ELSE NULL END)
       WHERE e.tenant_id = $1 AND e.type = 'Credit Note'`,
      [tenantId]
    );
    const notes = [...vendorNotes.rows, ...clientNotes.rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(notes);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── TRIAL BALANCE ────────────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/trial-balance', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const accountsRes = await pool.query(
      `SELECT a.name, a.ledger_code, a.type, a.balance_type,
        a.opening_balance + COALESCE(SUM(e.debit_amount - e.credit_amount), 0) AS closing_balance,
        COALESCE(SUM(e.debit_amount), 0) AS total_debit,
        COALESCE(SUM(e.credit_amount), 0) AS total_credit
       FROM tenant_ledger_accounts a
       LEFT JOIN tenant_ledger_entries e ON e.ledger_code = a.ledger_code AND e.tenant_id = $1
       WHERE a.tenant_id = $1
       GROUP BY a.id, a.name, a.ledger_code, a.type, a.balance_type, a.opening_balance
       ORDER BY a.type, a.name`,
      [tenantId]
    );
    res.json(accountsRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── PERIOD CLOSINGS ─────────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/period-closings', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query('SELECT * FROM tenant_period_closings WHERE tenant_id = $1 ORDER BY closing_date DESC', [tenantId]);
    res.json(dbRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── FINANCIAL REPORTS ──────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/reports/income-statement', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const revRes = await pool.query(
      `SELECT COALESCE(SUM(e.credit_amount - e.debit_amount), 0) as revenue
       FROM tenant_ledger_accounts a JOIN tenant_ledger_entries e ON e.ledger_code = a.ledger_code AND e.tenant_id = $1
       WHERE a.tenant_id = $1 AND a.type IN ('Income', 'Revenue')`,
      [tenantId]
    );
    const expRes = await pool.query(
      `SELECT COALESCE(SUM(e.debit_amount - e.credit_amount), 0) as expenses
       FROM tenant_ledger_accounts a JOIN tenant_ledger_entries e ON e.ledger_code = a.ledger_code AND e.tenant_id = $1
       WHERE a.tenant_id = $1 AND a.type = 'Expense'`,
      [tenantId]
    );
    const revenue = Number(revRes.rows[0]?.revenue || 0);
    const expenses = Number(expRes.rows[0]?.expenses || 0);
    res.json({ revenue, expenses, netProfit: revenue - expenses });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/reports/balance-sheet', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const dbRes = await pool.query(
      `SELECT a.name, a.type, a.ledger_code,
        a.opening_balance + COALESCE(SUM(e.debit_amount - e.credit_amount), 0) AS balance
       FROM tenant_ledger_accounts a
       LEFT JOIN tenant_ledger_entries e ON e.ledger_code = a.ledger_code AND e.tenant_id = $1
       WHERE a.tenant_id = $1 AND a.type IN ('Bank','Cash','Receivable','Payable','Asset','Liability')
       GROUP BY a.id, a.name, a.type, a.ledger_code, a.opening_balance
       ORDER BY a.type, a.name`,
      [tenantId]
    );
    res.json(dbRes.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── DASHBOARD SUMMARY ──────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/dashboard-summary', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  try {
    const bankRes = await pool.query(
      `SELECT COALESCE(SUM(opening_balance + (SELECT COALESCE(SUM(CASE WHEN type='Deposit' OR type='Transfer In' THEN amount ELSE -amount END), 0) FROM tenant_bank_cash_entries WHERE account_id = a.id)), 0) AS total
       FROM tenant_bank_cash_accounts a WHERE tenant_id = $1`,
      [tenantId]
    );
    const pettyRes = await pool.query(
      `SELECT COALESCE(SUM(current_balance), 0) AS total FROM tenant_petty_cash_floats WHERE tenant_id = $1`,
      [tenantId]
    );
    const clientRes = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type IN ('Invoice','Debit Note') THEN amount ELSE -amount END), 0) AS total FROM tenant_client_ledger_entries WHERE tenant_id = $1`,
      [tenantId]
    );
    const vendorRes = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type IN ('Bill','Debit Note') THEN amount ELSE -amount END), 0) AS total FROM tenant_vendor_ledger_entries WHERE tenant_id = $1`,
      [tenantId]
    );
    const employeeRes = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type IN ('Salary Advance','Petty Cash Advance') THEN amount ELSE -amount END), 0) AS total FROM tenant_employee_advances WHERE tenant_id = $1`,
      [tenantId]
    );
    const bankTotal = Number(bankRes.rows[0]?.total || 0);
    const pettyTotal = Number(pettyRes.rows[0]?.total || 0);
    const clientTotal = Number(clientRes.rows[0]?.total || 0);
    const vendorTotal = Number(vendorRes.rows[0]?.total || 0);
    const employeeTotal = Number(employeeRes.rows[0]?.total || 0);
    res.json({
      bankTotal, pettyTotal, clientTotal, vendorTotal, employeeTotal,
      netPosition: bankTotal + pettyTotal - vendorTotal,
      activity: []
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── PROJECT P&L ─────────────────────────────────────────────────────────────────

app.get('/api/tenant/ledger/project/:projectId', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { projectId } = req.params;
  try {
    const costRes = await pool.query(
      `SELECT COALESCE(SUM(e.debit_amount - e.credit_amount), 0) AS total_cost
       FROM tenant_ledger_accounts a JOIN tenant_ledger_entries e ON e.ledger_code = a.ledger_code AND e.tenant_id = $1
       WHERE a.tenant_id = $1 AND a.project_id = $2 AND a.type = 'Expense'`,
      [tenantId, projectId]
    );
    const revRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS invoices_raised FROM tenant_client_ledger_entries WHERE tenant_id = $1 AND project_tag = $2 AND type = 'Invoice'`,
      [tenantId, projectId]
    );
    const totalCost = Number(costRes.rows[0]?.total_cost || 0);
    const invoicesRaised = Number(revRes.rows[0]?.invoices_raised || 0);
    res.json({ totalCost, revenue: { invoicesRaised }, profitLoss: invoicesRaised - totalCost });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tenant/ledger/project/:projectId/history', authenticateToken, async (req: express.Request & { user?: any }, res) => {
  const tenantId = req.user.tenantId;
  const { projectId } = req.params;
  try {
    // Gather transactions from multiple sources
    const ledgerRows = await pool.query(
      `SELECT e.date::text, e.voucher_no, e.description AS note, e.debit_amount AS amount, 'Ledger Entry' AS source, a.type
       FROM tenant_ledger_entries e 
       JOIN tenant_ledger_accounts a ON a.ledger_code = e.ledger_code AND a.tenant_id = $1
       WHERE e.tenant_id = $1 AND a.project_id = $2`,
      [tenantId, projectId]
    );
    const pettyRows = await pool.query(
      `SELECT e.date::text, e.voucher_no, e.note, e.amount, 'Petty Cash' AS source, e.type 
       FROM tenant_petty_cash_entries e 
       JOIN tenant_petty_cash_floats f ON e.float_id = f.id
       WHERE f.tenant_id = $1 AND e.project_tag = $2`,
      [tenantId, projectId]
    );
    const vendorRows = await pool.query(
      `SELECT date::text, voucher_no, note, amount, 'Vendor Bill' AS source, type 
       FROM tenant_vendor_ledger_entries 
       WHERE tenant_id = $1 AND project_id = $2`,
      [tenantId, projectId]
    );
    const clientRows = await pool.query(
      `SELECT date::text, voucher_no, note, amount, 'Client Receipt' AS source, type 
       FROM tenant_client_ledger_entries 
       WHERE tenant_id = $1 AND project_id = $2`,
      [tenantId, projectId]
    );
    const history = [
      ...ledgerRows.rows.map((r: any) => ({ ...r, status: 'Posted' })),
      ...pettyRows.rows.map((r: any) => ({ ...r, status: 'Posted' })),
      ...vendorRows.rows.map((r: any) => ({ ...r, status: 'Posted' })),
      ...clientRows.rows.map((r: any) => ({ ...r, status: 'Posted' }))
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    res.json(history);
  } catch (err: any) { 
    console.error("Error in project history:", err);
    res.status(500).json({ error: err.message }); 
  }
});


app.listen(Number(port), '0.0.0.0', async () => {
  console.log(`
====================================================================
 🚀 INFRAOPS360 BACKEND API SERVER IS ONLINE
====================================================================
 📍 Local API:    http://localhost:${port}
 🌐 Network API:  http://0.0.0.0:${port}
 🛢️ Database:     PostgreSQL (Pool Connected)
 🛡️ Environment:  Development / Multi-Tenant Sandbox
====================================================================
`);

  // ── CREATE FULL ACCOUNTANT LEDGER TABLES ────────────────────────────────────
  try {
    // Bank & Cash accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_bank_cash_accounts (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'Bank',
        opening_balance NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_bank_cash_entries (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        account_id INTEGER REFERENCES tenant_bank_cash_accounts(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        linked_party VARCHAR(255) DEFAULT '',
        reference_no VARCHAR(255) DEFAULT '',
        note TEXT DEFAULT '',
        voucher_no VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Posted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Petty cash floats (new system)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_petty_cash_floats (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        custodian_id VARCHAR(255) NOT NULL,
        site_id VARCHAR(255) NOT NULL,
        opening_amount NUMERIC(15,2) DEFAULT 0,
        current_balance NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tenant_custodian_float UNIQUE (tenant_id, custodian_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_petty_cash_entries (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        custodian_id VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(255) DEFAULT 'General',
        project_tag VARCHAR(255) DEFAULT 'Overhead',
        amount NUMERIC(15,2) DEFAULT 0,
        voucher_no VARCHAR(100),
        note TEXT DEFAULT '',
        bill_reference VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'Posted',
        reversal_reason TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Client ledger entries (new columns)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_client_ledger_entries (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        client_id VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        project_tag VARCHAR(255) DEFAULT 'Overhead',
        note TEXT DEFAULT '',
        voucher_no VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Posted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Employee advances
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_employee_advances (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        note TEXT DEFAULT '',
        voucher_no VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Posted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // General ledger accounts master list
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_ledger_accounts (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        ledger_code VARCHAR(100) NOT NULL,
        type VARCHAR(100) DEFAULT 'Expense',
        opening_balance NUMERIC(15,2) DEFAULT 0,
        current_balance NUMERIC(15,2) DEFAULT 0,
        balance_type VARCHAR(20) DEFAULT 'Debit',
        status VARCHAR(50) DEFAULT 'Active',
        description TEXT DEFAULT '',
        project_id VARCHAR(255) DEFAULT 'Overhead',
        department VARCHAR(255) DEFAULT '',
        responsible_person VARCHAR(255) DEFAULT '',
        ledger_category VARCHAR(100) DEFAULT 'Project',
        overall_cost NUMERIC(15,2) DEFAULT 0,
        advance_paid NUMERIC(15,2) DEFAULT 0,
        company_category VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tenant_ledger_code UNIQUE (tenant_id, ledger_code)
      );
    `);
    // General ledger entries (double-entry)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_ledger_entries (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        ledger_code VARCHAR(100) NOT NULL,
        date VARCHAR(50) NOT NULL,
        debit_amount NUMERIC(15,2) DEFAULT 0,
        credit_amount NUMERIC(15,2) DEFAULT 0,
        description TEXT DEFAULT '',
        project_id VARCHAR(255) DEFAULT 'Overhead',
        voucher_no VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Posted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Journal vouchers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_journal_vouchers (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        date VARCHAR(50) NOT NULL,
        description TEXT DEFAULT '',
        project_id VARCHAR(255) DEFAULT 'Overhead',
        voucher_no VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_journal_entries (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        journal_id INTEGER REFERENCES tenant_journal_vouchers(id) ON DELETE CASCADE,
        account_id VARCHAR(255) NOT NULL,
        account_type VARCHAR(100) DEFAULT 'expense',
        debit_amount NUMERIC(15,2) DEFAULT 0,
        credit_amount NUMERIC(15,2) DEFAULT 0,
        note TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Period closings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_period_closings (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        closing_date VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Closed',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Purge ALL mock ledger accounts and entries to provide a 100% clean slate
    await pool.query("TRUNCATE TABLE tenant_ledger_accounts, tenant_ledger_entries RESTART IDENTITY CASCADE;");
    console.log('🧹 Purged all mock ledger accounts & entries! Clean slate ready.');
  } catch (ledgerDbErr) {
    console.error('❌ Failed to create accountant ledger tables:', ledgerDbErr);
  }

  // Create new simplified ledger tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_project_ledger_profiles (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        project_id VARCHAR(50) NOT NULL,
        total_cost NUMERIC(15,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tenant_project_ledger UNIQUE (tenant_id, project_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_project_petty_cash (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        project_id VARCHAR(50) NOT NULL,
        person_name VARCHAR(255) NOT NULL,
        given NUMERIC(15,2) DEFAULT 0,
        used NUMERIC(15,2) DEFAULT 0,
        left_amount NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tenant_project_person_pc UNIQUE (tenant_id, project_id, person_name)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_project_petty_cash_expenses (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        project_id VARCHAR(50) NOT NULL,
        person_name VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(255) NOT NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        bill VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_payroll_ledgers (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        employee VARCHAR(255) NOT NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_company_petty_cash (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(15,2) DEFAULT 0,
        balance NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_loans_ledger (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        lender VARCHAR(255) NOT NULL,
        principal NUMERIC(15,2) DEFAULT 0,
        outstanding NUMERIC(15,2) DEFAULT 0,
        emi_amount NUMERIC(15,2) DEFAULT 0,
        start_date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_loan_payments (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        loan_id INTEGER REFERENCES tenant_loans_ledger(id) ON DELETE CASCADE,
        amount NUMERIC(15,2) DEFAULT 0,
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alter table schemas and ensure resilient table definitions
    try {
      await pool.query('ALTER TABLE tenant_vendor_ledger_entries ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);');
      await pool.query('ALTER TABLE tenant_client_ledger_entries ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS custodian_id VARCHAR(255);');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS float_id INTEGER;');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ALTER COLUMN float_id DROP NOT NULL;');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS date VARCHAR(50);');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS type VARCHAR(100);');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT \'General\';');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS project_tag VARCHAR(255) DEFAULT \'Overhead\';');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2) DEFAULT 0;');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS voucher_no VARCHAR(100);');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS note TEXT DEFAULT \'\';');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'Posted\';');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT \'Cash\';');
      await pool.query('ALTER TABLE tenant_petty_cash_entries ADD COLUMN IF NOT EXISTS reversal_reason TEXT DEFAULT \'\';');
      await pool.query('ALTER TABLE tenant_petty_cash_floats ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;');
      await pool.query('ALTER TABLE tenant_stock_items ADD COLUMN IF NOT EXISTS current_stock NUMERIC(15,2) DEFAULT 0;');

      // Create tenant_assets table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_assets (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL DEFAULT 1,
          description VARCHAR(255) NOT NULL,
          purchase_cost NUMERIC(15,2) DEFAULT 0,
          purchase_date VARCHAR(50),
          useful_life_years INTEGER DEFAULT 5,
          assigned_project_id VARCHAR(50) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create tenant_stock_items table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_stock_items (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL DEFAULT 1,
          name VARCHAR(255) NOT NULL,
          unit_of_measure VARCHAR(50) DEFAULT 'Piece',
          category VARCHAR(100) DEFAULT 'General',
          current_stock NUMERIC(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (alterErr: any) {
      console.warn('⚠️ Table column alter warning:', alterErr.message);
    }

    // Seeding default project ledger profiles, petty cash and company expenses
    const profilesCount = await pool.query('SELECT COUNT(*) as count FROM tenant_project_ledger_profiles');
    if (parseInt(profilesCount.rows[0].count, 10) === 0) {
      const proj = await pool.query('SELECT project_id FROM tenant_projects LIMIT 1');
      if (proj.rows.length > 0) {
        const pId = proj.rows[0].project_id;
        
        await pool.query(
          `INSERT INTO tenant_project_ledger_profiles (tenant_id, project_id, total_cost, notes)
           VALUES (1, $1, 5000000, 'Main project budget and costing overview') ON CONFLICT DO NOTHING`,
          [pId]
        );

        await pool.query(
          `INSERT INTO tenant_project_petty_cash (tenant_id, project_id, person_name, given, used, left_amount)
           VALUES (1, $1, 'Ramesh (Supervisor)', 20000, 14500, 5500) ON CONFLICT DO NOTHING`,
          [pId]
        );
        await pool.query(
          `INSERT INTO tenant_project_petty_cash_expenses (tenant_id, project_id, person_name, date, category, amount, bill)
           VALUES (1, $1, 'Ramesh (Supervisor)', '2026-08-05', 'Material Expense', 10000, 'cement_delivery.pdf'),
                  (1, $1, 'Ramesh (Supervisor)', '2026-08-06', 'General Utilities', 4500, 'tea_snacks.pdf')`,
          [pId]
        );

        await pool.query(
          `INSERT INTO tenant_project_petty_cash (tenant_id, project_id, person_name, given, used, left_amount)
           VALUES (1, $1, 'Suresh (Site Incharge)', 15000, 15000, 0) ON CONFLICT DO NOTHING`,
          [pId]
        );
        await pool.query(
          `INSERT INTO tenant_project_petty_cash_expenses (tenant_id, project_id, person_name, date, category, amount, bill)
           VALUES (1, $1, 'Suresh (Site Incharge)', '2026-08-04', 'Transport & Fuel', 15000, 'fuel_mixer.pdf')`,
          [pId]
        );
      }
    }

    const payrollCount = await pool.query('SELECT COUNT(*) as count FROM tenant_payroll_ledgers');
    if (parseInt(payrollCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO tenant_payroll_ledgers (tenant_id, date, employee, amount, status)
        VALUES (1, '2026-08-01', 'Ramesh', 35000, 'Paid'),
               (1, '2026-08-01', 'Suresh', 28000, 'Paid')
      `);
    }

    const compPcCount = await pool.query('SELECT COUNT(*) as count FROM tenant_company_petty_cash');
    if (parseInt(compPcCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO tenant_company_petty_cash (tenant_id, date, category, type, amount, balance)
        VALUES (1, '2026-08-01', 'Float Top-up', 'topup', 10000, 10000),
               (1, '2026-08-05', 'Office Supplies', 'expense', 1200, 8800)
      `);
    }

    const loansCount = await pool.query('SELECT COUNT(*) as count FROM tenant_loans_ledger');
    if (parseInt(loansCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO tenant_loans_ledger (tenant_id, lender, principal, outstanding, emi_amount, start_date)
        VALUES (1, 'ABC Finance Co.', 500000, 320000, 25000, '2026-04-01')
      `);
    }

    // // Initialize tenant_projects table automatically
  try {
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
        is_pinned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add is_pinned to existing tables if missing
    await pool.query('ALTER TABLE tenant_projects ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;');

    console.log('✅ Auto-created/verified tenant_projects table on server startup');

    // Initialize tenant_worksites table automatically
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_worksites (
        id SERIAL PRIMARY KEY,
        worksite_id VARCHAR(50) NOT NULL UNIQUE,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        supervisor VARCHAR(255) NOT NULL,
        contact VARCHAR(50) NOT NULL,
        workers_count INTEGER DEFAULT 0,
        geofence_status VARCHAR(50) DEFAULT 'Disabled',
        operational_status VARCHAR(50) DEFAULT 'Active',
        safety_rating VARCHAR(50) DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Auto-created/verified tenant_worksites table on server startup');

    // Initialize tenant_divisions table automatically
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_divisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        pincodes TEXT,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tenant_division UNIQUE (tenant_id, name)
      );
    `);
    console.log('✅ Auto-created/verified tenant_divisions table on server startup');

    // Add division_id column to tenant_users table if missing
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES tenant_divisions(id) ON DELETE SET NULL;');
    console.log('✅ Auto-created/verified division_id column in tenant_users table on server startup');

    // Add extended employee profile columns
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(20);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(12);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS residing_address TEXT;');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS permanent_address TEXT;');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS emergency_contact_mobile VARCHAR(20);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS aadhar_copy TEXT;');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS profile_photo TEXT;');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false;');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(200);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(200);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS sub_role VARCHAR(100);');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS employee_type VARCHAR(100) DEFAULT \'Permanent\';');
    await pool.query('ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS joining_date VARCHAR(50);');
    console.log('✅ Auto-created/verified extended employee profile columns in tenant_users');

    // Add custom_fields columns for dynamic fields configuration
    await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_fields JSONB;');
    await pool.query('ALTER TABLE tenant_projects ADD COLUMN IF NOT EXISTS custom_fields JSONB;');
    await pool.query('ALTER TABLE tenant_worksites ADD COLUMN IF NOT EXISTS custom_fields JSONB;');
    console.log('✅ Auto-created/verified custom_fields columns in tenants, tenant_projects, and tenant_worksites');

    // Create Tenant Attendance Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_attendance_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES tenant_users(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP NOT NULL,
        check_out_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'On Duty',
        work_hours NUMERIC(5, 2)
      );
    `);
    console.log('✅ Auto-created/verified tenant_attendance_logs table on server startup');

    // Create Form Fields Config Table
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
      // ── MOCK DATA SEEDING FOR ACCOUNTING & LEDGER ───────────────────────────────
    console.log('🌱 Starting enhanced mock data seeding...');
    
    // Clear existing data for tenant 1 to start fresh and avoid unique constraint conflicts
    try {
      await pool.query("DELETE FROM tenant_ledger_entries WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_petty_cash_entries WHERE float_id IN (SELECT id FROM tenant_petty_cash_floats WHERE tenant_id = 1)");
      await pool.query("DELETE FROM tenant_petty_cash_floats WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_vendor_ledger_entries WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_client_ledger_entries WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_ledger_accounts WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_worksites WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_projects WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_vendors WHERE tenant_id = 1");
      await pool.query("DELETE FROM tenant_clients WHERE tenant_id = 1");
      console.log('🧹 Cleaned old mock records successfully');
    } catch (e: any) {
      console.warn('⚠️ Warning cleaning old mock records:', e.message);
    }

    // 1. Projects & Worksites Seeding
    await pool.query(`
      INSERT INTO tenant_projects (project_id, tenant_id, name, location, customer, status, contract_start_date, contract_end_date)
      VALUES 
        ('PRJ-001', 1, 'Metro Station Extension Block-C', 'Sector 62, Noida, UP', 'DMRC Limited', 'Active', '2026-01-01', '2026-12-31'),
        ('PRJ-002', 1, 'Flyover Block Junction Phase-II', 'Indirapuram, Ghaziabad, UP', 'NHAI', 'Active', '2026-02-15', '2027-02-14'),
        ('PRJ-003', 1, 'High-Rise Residential Foundations', 'Sector 150, Noida, UP', 'Eldeco Group', 'Active', '2026-03-01', '2026-11-30')
      ON CONFLICT (project_id) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO tenant_worksites (worksite_id, tenant_id, name, location, type, supervisor, contact, workers_count)
      VALUES 
        ('WKS-001', 1, 'Sector 62 Metro Site', 'Sector 62, Noida, UP', 'Metro Construction', 'Ramesh', '9876543210', 45),
        ('WKS-002', 1, 'Indirapuram Flyover Site', 'Indirapuram, Ghaziabad, UP', 'Bridge Construction', 'Suresh', '9876543211', 60),
        ('WKS-003', 1, 'Sector 150 Residential Site', 'Sector 150, Noida, UP', 'Civil Construction', 'Dev', '9876543212', 30)
      ON CONFLICT (worksite_id) DO NOTHING
    `);

    // 2. Company Overhead & Asset/Bank Accounts
    const defaultLedgers = [
      ['Staff Salary & Payroll', 'COMP-001', 'Expense', 'Debit', 'Staff Salary & Payroll', 'Monthly salary disbursement ledger', 'HR'],
      ['Office Rent & Utilities', 'COMP-002', 'Expense', 'Debit', 'Office Rent & Overhead', 'Office rent, electricity, internet', 'Finance'],
      ['Director Drawings', 'COMP-003', 'Expense', 'Debit', 'Director Drawings / Loans', 'Director personal withdrawals', 'Finance'],
      ['SBI Main Account', 'COMP-004', 'Bank', 'Debit', 'General Bank / Current Account', 'Primary company bank account', 'Finance'],
    ];
    for (const [name, code, type, balType, cat, desc, dept] of defaultLedgers) {
      await pool.query(
        `INSERT INTO tenant_ledger_accounts (tenant_id, name, ledger_code, type, opening_balance, balance_type, status, description, project_id, department, ledger_category, company_category)
         VALUES (1, $1, $2, $3, 0, $4, 'Active', $5, 'Overhead', $6, 'Company', $7) ON CONFLICT (tenant_id, ledger_code) DO NOTHING`,
        [name, code, type, balType, desc, dept, cat]
      );
    }

    // 3. Project Ledgers Seeding
    const defaultProjLedgers = [
      // PRJ-001
      ['Cement Purchase Ledger', 'LDG-001', 'Expense', 'Debit', 'Material Procurement', 'Bulk cement procurement ledger', 'Procurement', 'PRJ-001'],
      ['Steel Procurement Ledger', 'LDG-002', 'Expense', 'Debit', 'Material Procurement', 'Bulk reinforcement steel ledger', 'Procurement', 'PRJ-001'],
      ['Site Equipment Rental', 'LDG-003', 'Expense', 'Debit', 'Equipment Rental', 'Mixer and hoist rental charges', 'Operations', 'PRJ-001'],
      // PRJ-002
      ['Sand & Aggregates Ledger', 'LDG-004', 'Expense', 'Debit', 'Material Procurement', 'Coarse aggregate & sand supply log', 'Procurement', 'PRJ-002'],
      ['Heavy Machinery Hire', 'LDG-005', 'Expense', 'Debit', 'Equipment Rental', 'Crane and backhoe loader rentals', 'Operations', 'PRJ-002'],
      // PRJ-003
      ['Earthwork Excavation Ledger', 'LDG-006', 'Expense', 'Debit', 'Civil Works', 'Subcontract excavation work cost log', 'Engineering', 'PRJ-003'],
      ['Foundation Concrete Mix', 'LDG-007', 'Expense', 'Debit', 'Material Procurement', 'Ready-mix concrete logs', 'Procurement', 'PRJ-003']
    ];
    for (const [name, code, type, balType, cat, desc, dept, projId] of defaultProjLedgers) {
      await pool.query(
        `INSERT INTO tenant_ledger_accounts (tenant_id, name, ledger_code, type, opening_balance, balance_type, status, description, project_id, department, ledger_category, company_category)
         VALUES (1, $1, $2, $3, 0, $4, 'Active', $5, $8, $6, 'Project', $7) ON CONFLICT (tenant_id, ledger_code) DO NOTHING`,
        [name, code, type, balType, desc, dept, cat, projId]
      );
    }

    // 4. Double-Entry Vouchers Seeding
    console.log('🌱 Seeding rich double-entry ledger transactions...');
    const mockEntries = [
        ['COMP-001', '2026-08-01', 35000, 0, 'August payroll salary payout for Noida team', 'Overhead', 'VCH-2026-001'],
        ['COMP-004', '2026-08-01', 0, 35000, 'August payroll salary payout for Noida team', 'Overhead', 'VCH-2026-001'],
        ['COMP-002', '2026-08-02', 18000, 0, 'Head office building monthly rent payout', 'Overhead', 'VCH-2026-002'],
        ['COMP-004', '2026-08-02', 0, 18000, 'Head office building monthly rent payout', 'Overhead', 'VCH-2026-002'],
        ['COMP-003', '2026-08-05', 5000, 0, 'Director travel advance loan withdrawal', 'Overhead', 'VCH-2026-003'],
        ['COMP-004', '2026-08-05', 0, 5000, 'Director travel advance loan withdrawal', 'Overhead', 'VCH-2026-003'],

        // Noida Metro (PRJ-001) Costs
        ['LDG-001', '2026-08-03', 120000, 0, 'Procurement of 300 bags OPC Cement from Ultratech', 'PRJ-001', 'VCH-2026-004'],
        ['COMP-004', '2026-08-03', 0, 120000, 'Ultratech cement invoice payment', 'PRJ-001', 'VCH-2026-004'],
        ['LDG-002', '2026-08-04', 250000, 0, 'Reinforcement TMT steel - 5 tons from Tata Steel', 'PRJ-001', 'VCH-2026-005'],
        ['COMP-004', '2026-08-04', 0, 250000, 'Tata Steel reinforcement invoice payment', 'PRJ-001', 'VCH-2026-005'],
        ['LDG-003', '2026-08-06', 15000, 0, 'Concrete mixer rental billing - Noida Station', 'PRJ-001', 'VCH-2026-006'],
        ['COMP-004', '2026-08-06', 0, 15000, 'Concrete mixer rental billing - Noida Station', 'PRJ-001', 'VCH-2026-006'],

        // Ghaziabad Flyover (PRJ-002) Costs
        ['LDG-004', '2026-08-04', 85000, 0, 'Aggregate supply (20mm) - 15 truckloads', 'PRJ-002', 'VCH-2026-007'],
        ['COMP-004', '2026-08-04', 0, 85000, 'Noida Stone Quarry payment', 'PRJ-002', 'VCH-2026-007'],
        ['LDG-005', '2026-08-05', 95000, 0, 'Hydra mobile crane 15-ton rental billing', 'PRJ-002', 'VCH-2026-008'],
        ['COMP-004', '2026-08-05', 0, 95000, 'Hydra crane rental payment', 'PRJ-002', 'VCH-2026-008'],

        // Residential Piling (PRJ-003) Costs
        ['LDG-006', '2026-08-08', 180000, 0, 'Backhoe excavator earthwork subcontract', 'PRJ-003', 'VCH-2026-009'],
        ['COMP-004', '2026-08-08', 0, 180000, 'Earth Movers Subcontractor payment', 'PRJ-003', 'VCH-2026-009'],
        ['LDG-007', '2026-08-12', 320000, 0, 'Ready-Mix Concrete delivery M35 grade', 'PRJ-003', 'VCH-2026-010'],
        ['COMP-004', '2026-08-12', 0, 320000, 'L&T Ready-Mix invoice settlement', 'PRJ-003', 'VCH-2026-010']
      ];

      for (const [code, date, debit, credit, desc, projId, vNo] of mockEntries) {
        await pool.query(
          `INSERT INTO tenant_ledger_entries (tenant_id, ledger_code, date, debit_amount, credit_amount, description, project_id, voucher_no, status)
           VALUES (1, $1, $2, $3, $4, $5, $6, $7, 'Posted')`,
          [code, date, debit, credit, desc, projId, vNo]
        );
      }
      console.log('✅ Mock ledger transactions successfully seeded');

    // 5. Seed default vendor and client to link notes/receipts
    const newVendor = await pool.query(`
      INSERT INTO tenant_vendors (tenant_id, name, code, vendor_type, status)
      VALUES (1, 'Ultratech Cement Ltd.', 'VND-001', 'Material Supplier', 'Active')
      RETURNING id
    `);
    const vendorId = newVendor.rows[0].id;

    const newClient = await pool.query(`
      INSERT INTO tenant_clients (tenant_id, name, code, status)
      VALUES (1, 'Delhi Metro Rail Corporation', 'CLI-001', 'Active')
      RETURNING id
    `);
    const clientId = newClient.rows[0].id;

    // 6. Debit & Credit Notes Seeding
    await pool.query(`
      INSERT INTO tenant_vendor_ledger_entries (tenant_id, vendor_id, date, type, amount, project_id, voucher_no, note, status)
      VALUES 
        (1, $1, '2026-08-05', 'Debit Note', 15000, 'PRJ-001', 'DN-2026-001', 'Damaged cement bags return adjustment', 'Posted'),
        (1, $1, '2026-08-06', 'Credit Note', 25000, 'PRJ-001', 'CN-2026-001', 'Discount allowance for Tata Steel bulk reinforcement purchase', 'Posted'),
        (1, $1, '2026-08-11', 'Debit Note', 8000, 'PRJ-002', 'DN-2026-002', 'Sub-standard sand quality reduction deduction', 'Posted'),
        (1, $1, '2026-08-14', 'Credit Note', 12000, 'PRJ-003', 'CN-2026-002', 'Excavation machine hire breakdown discount allowance', 'Posted')
    `, [vendorId]);
    console.log('✅ Mock debit and credit notes successfully seeded');

    // 7. Client Receipts Seeding (Project Inflow / Revenue)
    await pool.query(`
      INSERT INTO tenant_client_ledger_entries (tenant_id, client_id, date, type, amount, project_id, voucher_no, note, status)
      VALUES 
        (1, $1, '2026-08-01', 'Receipt', 1200000, 'PRJ-001', 'REC-2026-001', 'DMRC Milestone #1 completion payment receipt', 'Posted'),
        (1, $1, '2026-08-02', 'Receipt', 2500000, 'PRJ-002', 'REC-2026-002', 'NHAI Stage-1 mobilization advance receipt', 'Posted'),
        (1, $1, '2026-08-10', 'Receipt', 950000, 'PRJ-003', 'REC-2026-003', 'Eldeco piling foundation stage client bill check clearing', 'Posted')
    `, [clientId]);
    console.log('✅ Mock client invoices/receipts successfully seeded');

    const usersRes = await pool.query('SELECT id, name FROM tenant_users WHERE tenant_id = 1 LIMIT 3');
    if (usersRes.rows.length > 0) {
      // Noida Metro site (Supervisor 1 - Ramesh)
      const sup1 = usersRes.rows[0].id;
      const newFloat1 = await pool.query(`
        INSERT INTO tenant_petty_cash_floats (tenant_id, custodian_id, site_id, opening_amount, current_balance)
        VALUES (1, $1, 'WKS-001', 30000, 18500)
        RETURNING id
      `, [sup1]);
      const floatId1 = newFloat1.rows[0].id;

      await pool.query(`
        INSERT INTO tenant_petty_cash_entries (float_id, date, type, category, project_tag, amount, voucher_no, note, status)
        VALUES 
          ($1, '2026-08-10', 'Expense', 'Material Purchase', 'PRJ-001', 6500, 'PC-VCH-101', 'Minor plumbing items purchase', 'Posted'),
          ($1, '2026-08-12', 'Expense', 'Site Utilities', 'PRJ-001', 5000, 'PC-VCH-102', 'Weekly site water tanker charges', 'Posted')
      `, [floatId1]);

      if (usersRes.rows.length > 1) {
        // Indirapuram Flyover site (Supervisor 2 - Suresh)
        const sup2 = usersRes.rows[1].id;
        const newFloat2 = await pool.query(`
          INSERT INTO tenant_petty_cash_floats (tenant_id, custodian_id, site_id, opening_amount, current_balance)
          VALUES (1, $1, 'WKS-002', 50000, 32000)
          RETURNING id
        `, [sup2]);
        const floatId2 = newFloat2.rows[0].id;

        await pool.query(`
          INSERT INTO tenant_petty_cash_entries (float_id, date, type, category, project_tag, amount, voucher_no, note, status)
          VALUES 
            ($1, '2026-08-08', 'Expense', 'Fuel & Transport', 'PRJ-002', 12000, 'PC-VCH-201', 'Site supervisor diesel topup for transport mixer', 'Posted'),
            ($1, '2026-08-10', 'Expense', 'Safety Gear', 'PRJ-002', 6000, 'PC-VCH-202', 'Emergency purchase of 20 high-vis vests and safety helmets', 'Posted')
        `, [floatId2]);
      }
      console.log('✅ Supervisor petty cash floats and expenses successfully seeded');
    }
    console.log(`
====================================================================
 🟢 ALL DATABASE TABLES & MIGRATIONS SYNCED!
 🟢 SERVER READY TO PROCESS API REQUESTS
====================================================================
`);
  } catch (dbErr) {
    console.error('❌ Failed to auto-initialize DB components:', dbErr);
  }
});
