/*
 Env readiness checker for SehatSphere backend
 Usage: node scripts/check_env.js
 Exits with code 0 when all required env vars are present, otherwise exits 1.
*/

const required = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET'
];

const missing = required.filter(k => !process.env[k]);

if (missing.length === 0) {
  console.log('✅ All required environment variables are set.');
  process.exit(0);
} else {
  console.error('❌ Missing environment variables:');
  missing.forEach(k => console.error(' -', k));
  console.error('\nPlease set them (e.g., in Render env settings or a .env file).');
  process.exit(1);
}
