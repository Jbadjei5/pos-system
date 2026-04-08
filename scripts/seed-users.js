const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_system',
    charset: 'utf8mb4'
};

async function seedUsers() {
    let db;
    
    try {
        // Connect to database
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
        
        // Demo users to create
        const demoUsers = [
            {
                username: 'admin',
                email: 'admin@pos.com',
                password: 'admin123',
                full_name: 'System Administrator',
                phone: '+233123456789',
                role: 'admin'
            },
            {
                username: 'cashier',
                email: 'cashier@pos.com',
                password: 'cashier123',
                full_name: 'Cashier User',
                phone: '+233123456790',
                role: 'cashier'
            },
            {
                username: 'manager',
                email: 'manager@pos.com',
                password: 'manager123',
                full_name: 'Store Manager',
                phone: '+233123456791',
                role: 'manager'
            }
        ];
        
        console.log('Creating demo users...');
        
        for (const user of demoUsers) {
            // Check if user already exists
            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [user.username, user.email]
            );
            
            if (existingUsers.length > 0) {
                console.log(`User ${user.username} already exists, skipping...`);
                continue;
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            // Insert user
            const [result] = await db.execute(`
                INSERT INTO users (username, email, password, full_name, phone, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [user.username, user.email, hashedPassword, user.full_name, user.phone, user.role]);
            
            console.log(`Created user: ${user.username} (${user.email})`);
        }
        
        console.log('\nDemo users created successfully!');
        console.log('\nLogin credentials:');
        console.log('==================');
        demoUsers.forEach(user => {
            console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
        });
        console.log('==================');
        
    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        if (db) {
            await db.end();
            console.log('Database connection closed');
        }
    }
}

// Run the seed function
seedUsers();
