const bcrypt = require('bcrypt');

const password = process.argv[2] || 'AdminSecretPass123!';

bcrypt.hash(password, 10).then(hash => {
  console.log('====================================================');
  console.log('InfraOps360 SaaS Super-Admin Password Hash Generator');
  console.log('====================================================');
  console.log(`Plain Password: ${password}`);
  console.log(`Bcrypt Hash:   ${hash}`);
  console.log('\nAdd the following lines to apps/backend/.env:');
  console.log(`ADMIN_EMAIL=admin@easyapps360.com`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`JWT_SECRET=infraops360_super_secret_jwt_key_2026`);
  console.log('====================================================');
}).catch(err => {
  console.error('Error generating hash:', err);
});
