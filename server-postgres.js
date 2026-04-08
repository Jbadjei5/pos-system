const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/pos_system',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
    try {
        await pool.query('SELECT NOW()');
        console.log('Connected to PostgreSQL database');
        
        // Create tables if they don't exist
        await createTables();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

async function createTables() {
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role VARCHAR(20) DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
                full_name VARCHAR(100),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Products table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                product_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                barcode VARCHAR(50) UNIQUE,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                cost_price DECIMAL(10,2),
                stock_quantity INTEGER DEFAULT 0,
                reorder_level INTEGER DEFAULT 10,
                min_stock_level INTEGER DEFAULT 5,
                max_stock_level INTEGER DEFAULT 1000,
                unit VARCHAR(20) DEFAULT 'pcs',
                is_active BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(500),
                supplier_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await pool.query('CREATE INDEX IF NOT EXISTS idx_product_code ON products(product_code)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_barcode ON products(barcode)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_category ON products(category_id)');

        // Customers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                customer_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                address TEXT,
                city VARCHAR(50),
                state VARCHAR(50),
                postal_code VARCHAR(20),
                country VARCHAR(50),
                credit_limit DECIMAL(10,2) DEFAULT 0,
                current_balance DECIMAL(10,2) DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Sales table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                sale_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(10,2) NOT NULL,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer')),
                payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial', 'refunded')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Sale items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                total_price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Products routes
app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, category_id } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = true
        `;
        let params = [];

        if (search) {
            query += ` AND (p.name ILIKE $${params.length + 1} OR p.product_code ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        if (category_id) {
            query += ` AND p.category_id = $${params.length + 1}`;
            params.push(category_id);
        }

        query += ` ORDER BY p.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM products 
            WHERE is_active = true
            ${search ? `AND (name ILIKE $1 OR product_code ILIKE $1)` : ''}
            ${category_id ? `AND category_id = $2` : ''}
        `;
        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            products: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Categories routes
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [
            productsResult,
            lowStockResult,
            todaySalesResult,
            monthSalesResult
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true'),
            pool.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= reorder_level AND is_active = true'),
            pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(sale_date) = CURRENT_DATE'),
            pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(sale_date) >= DATE_TRUNC(\'month\', CURRENT_DATE)')
        ]);

        res.json({
            totalProducts: parseInt(productsResult.rows[0].count),
            lowStockItems: parseInt(lowStockResult.rows[0].count),
            todaySales: {
                count: parseInt(todaySalesResult.rows[0].count),
                total: parseFloat(todaySalesResult.rows[0].total)
            },
            monthSales: {
                count: parseInt(monthSalesResult.rows[0].count),
                total: parseFloat(monthSalesResult.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`POS Backend Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
});

module.exports = app;
