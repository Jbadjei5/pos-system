const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SQLite database connection
const db = new sqlite3.Database('./pos_system.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'cashier',
            full_name TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table created or already exists');
            seedDemoUsers();
        }
    });
}

// Seed demo users
function seedDemoUsers() {
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

    demoUsers.forEach(async (user) => {
        // Check if user already exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [user.username, user.email], async (err, row) => {
            if (err) {
                console.error('Error checking user:', err.message);
                return;
            }

            if (row) {
                console.log(`User ${user.username} already exists, skipping...`);
                return;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Insert user
            db.run(`
                INSERT INTO users (username, email, password, full_name, phone, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [user.username, user.email, hashedPassword, user.full_name, user.phone, user.role], function(err) {
                if (err) {
                    console.error('Error creating user:', err.message);
                } else {
                    console.log(`Created user: ${user.username} (${user.email})`);
                }
            });
        });
    });
}

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'pos-system-jwt-secret-key-2024', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { 
            username, 
            email, 
            password, 
            full_name, 
            phone, 
            role = 'cashier' 
        } = req.body;
        
        // Validation
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ 
                error: 'Username, email, password, and full name are required' 
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long' 
            });
        }
        
        // Check if username already exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                return res.status(409).json({ 
                    error: 'Username or email already exists' 
                });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            db.run(`
                INSERT INTO users (username, email, password, full_name, phone, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [username, email, hashedPassword, full_name, phone, role], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create user' });
                }
                
                // Get the created user
                db.get('SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?', [this.lastID], (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to retrieve user' });
                    }
                    
                    // Create JWT token
                    const token = jwt.sign(
                        { 
                            id: user.id, 
                            username: user.username, 
                            role: user.role 
                        },
                        process.env.JWT_SECRET || 'pos-system-jwt-secret-key-2024',
                        { expiresIn: '24h' }
                    );
                    
                    res.status(201).json({
                        message: 'User created successfully',
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            full_name: user.full_name,
                            phone: user.phone,
                            role: user.role,
                            created_at: user.created_at
                        }
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role 
                },
                process.env.JWT_SECRET || 'pos-system-jwt-secret-key-2024',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    full_name: user.full_name
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Demo users created:`);
    console.log(`Admin: admin@pos.com / admin123`);
    console.log(`Cashier: cashier@pos.com / cashier123`);
    console.log(`Manager: manager@pos.com / manager123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Closing database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
