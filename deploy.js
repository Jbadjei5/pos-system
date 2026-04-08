// Deployment script for Vercel
const fs = require('fs');
const path = require('path');

// Copy production environment file
if (fs.existsSync('.env.production')) {
    fs.copyFileSync('.env.production', '.env');
    console.log('✅ Production environment file copied');
}

// Ensure database directory exists
const dbDir = path.dirname('./pos_system.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ Database directory created');
}

console.log('🚀 Ready for Vercel deployment');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Deploy to Vercel: vercel --prod');
console.log('3. Visit your deployed URL');
console.log('');
