const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_system',
    charset: 'utf8mb4'
};

let db;

async function initializeDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
        
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
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role ENUM('admin', 'manager', 'cashier') DEFAULT 'cashier',
                full_name VARCHAR(100),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Categories table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Products table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                category_id INT,
                barcode VARCHAR(50) UNIQUE,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                cost_price DECIMAL(10,2),
                stock_quantity INT DEFAULT 0,
                reorder_level INT DEFAULT 10,
                min_stock_level INT DEFAULT 5,
                max_stock_level INT DEFAULT 1000,
                unit VARCHAR(20) DEFAULT 'pcs',
                is_active BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(500),
                supplier_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                INDEX idx_product_code (product_code),
                INDEX idx_barcode (barcode),
                INDEX idx_category (category_id)
            )
        `);

        // Customers table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                loyalty_points INT DEFAULT 0,
                total_purchases DECIMAL(12,2) DEFAULT 0.00,
                credit_limit DECIMAL(10,2) DEFAULT 0.00,
                current_balance DECIMAL(10,2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_customer_code (customer_code),
                INDEX idx_phone (phone),
                INDEX idx_email (email)
            )
        `);

        // Sales table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id INT,
                user_id INT,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(12,2) NOT NULL,
                tax_amount DECIMAL(12,2) DEFAULT 0.00,
                discount_amount DECIMAL(12,2) DEFAULT 0.00,
                total_amount DECIMAL(12,2) NOT NULL,
                payment_method ENUM('cash', 'paystack', 'card', 'mobile_money') NOT NULL,
                payment_reference VARCHAR(100),
                payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_sale_number (sale_number),
                INDEX idx_sale_date (sale_date),
                INDEX idx_customer (customer_id),
                INDEX idx_user (user_id)
            )
        `);

        // Sale items table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sale_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(12,2) NOT NULL,
                cost_price DECIMAL(10,2),
                profit DECIMAL(12,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
                INDEX idx_sale (sale_id),
                INDEX idx_product (product_id)
            )
        `);

        // Inventory transactions table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS inventory_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                transaction_type ENUM('in', 'out', 'adjustment', 'transfer') NOT NULL,
                quantity INT NOT NULL,
                reference_type ENUM('sale', 'purchase', 'adjustment', 'transfer', 'return') NOT NULL,
                reference_id INT,
                notes TEXT,
                user_id INT,
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_product (product_id),
                INDEX idx_transaction_date (transaction_date),
                INDEX idx_reference (reference_type, reference_id)
            )
        `);

        // Suppliers table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                supplier_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                contact_person VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                tax_identification_number VARCHAR(50),
                payment_terms VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_supplier_code (supplier_code)
            )
        `);

        // Insert default categories
        await db.execute(`
            INSERT IGNORE INTO categories (name, description) VALUES
            ('Electronics', 'Electronic devices and accessories'),
            ('Food & Beverages', 'Food items and drinks'),
            ('Clothing', 'Apparel and fashion items'),
            ('Stationery', 'Office and school supplies'),
            ('Books', 'Books and educational materials'),
            ('Health & Beauty', 'Personal care products'),
            ('Home & Garden', 'Household items and garden supplies'),
            ('Sports & Outdoors', 'Sports equipment and outdoor gear'),
            ('Toys & Games', 'Children toys and games'),
            ('Other', 'Miscellaneous items')
        `);

        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Helper function to generate sale number
async function generateSaleNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM sales WHERE DATE(sale_date) = CURDATE()'
    );
    const sequence = String(rows[0].count + 1).padStart(4, '0');
    
    return `SALE${year}${month}${day}${sequence}`;
}

// Authentication
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
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(409).json({ 
                error: 'Username or email already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const [result] = await db.execute(`
            INSERT INTO users (username, email, password, full_name, phone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [username, email, hashedPassword, full_name, phone, role]);
        
        // Get the created user
        const [newUsers] = await db.execute(
            'SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );
        
        const newUser = newUsers[0];
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: newUser.id, 
                username: newUser.username, 
                role: newUser.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name,
                phone: newUser.phone,
                role: newUser.role,
                created_at: newUser.created_at
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
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
            process.env.JWT_SECRET || 'your-secret-key',
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

// Products API
app.get('/api/products', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 50 } = req.query;
        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = TRUE
        `;
        const params = [];

        if (search) {
            query += ' AND (p.name LIKE ? OR p.product_code LIKE ? OR p.barcode LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND p.category_id = ?';
            params.push(category);
        }

        query += ' ORDER BY p.name LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const [products] = await db.execute(query, params);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM products p 
            WHERE p.is_active = TRUE
        `;
        const countParams = [];

        if (search) {
            countQuery += ' AND (p.name LIKE ? OR p.product_code LIKE ? OR p.barcode LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category) {
            countQuery += ' AND p.category_id = ?';
            countParams.push(category);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        const {
            product_code,
            name,
            category_id,
            barcode,
            description,
            price,
            cost_price,
            stock_quantity,
            reorder_level,
            min_stock_level,
            max_stock_level,
            unit,
            supplier_id
        } = req.body;

        if (!product_code || !name || !price) {
            return res.status(400).json({ error: 'Product code, name, and price are required' });
        }

        const [result] = await db.execute(`
            INSERT INTO products (
                product_code, name, category_id, barcode, description, 
                price, cost_price, stock_quantity, reorder_level, 
                min_stock_level, max_stock_level, unit, supplier_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            product_code, name, category_id, barcode, description,
            price, cost_price, stock_quantity || 0, reorder_level || 10,
            min_stock_level || 5, max_stock_level || 1000, unit || 'pcs', supplier_id
        ]);

        // Create inventory transaction
        await db.execute(`
            INSERT INTO inventory_transactions (
                product_id, transaction_type, quantity, reference_type, reference_id, user_id
            ) VALUES (?, 'in', ?, 'adjustment', ?, ?)
        `, [result.insertId, stock_quantity || 0, result.insertId, req.user.id]);

        res.status(201).json({ id: result.insertId, message: 'Product created successfully' });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id') {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateValues.push(id);

        await db.execute(`
            UPDATE products SET ${updateFields.join(', ')} WHERE id = ?
        `, updateValues);

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Customers API
app.get('/api/customers', async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        let query = 'SELECT * FROM customers WHERE is_active = TRUE';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY name LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const [customers] = await db.execute(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE is_active = TRUE';
        const countParams = [];

        if (search) {
            countQuery += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address,
            city,
            country,
            date_of_birth,
            gender
        } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        // Generate customer code
        const customer_code = `CUST${Date.now()}`;

        const [result] = await db.execute(`
            INSERT INTO customers (
                customer_code, name, email, phone, address, city, 
                country, date_of_birth, gender
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [customer_code, name, email, phone, address, city, country, date_of_birth, gender]);

        res.status(201).json({ 
            id: result.insertId, 
            customer_code,
            message: 'Customer created successfully' 
        });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sales API
app.post('/api/sales', authenticateToken, async (req, res) => {
    try {
        const {
            customer_id,
            items,
            payment_method,
            payment_reference,
            discount_amount = 0,
            notes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Sale items are required' });
        }

        // Start transaction
        await db.beginTransaction();

        try {
            // Calculate totals
            let subtotal = 0;
            for (const item of items) {
                const itemTotal = item.unit_price * item.quantity;
                subtotal += itemTotal;
            }

            const tax_amount = subtotal * 0.125; // 12.5% VAT
            const total_amount = subtotal + tax_amount - discount_amount;

            // Generate sale number
            const sale_number = await generateSaleNumber();

            // Create sale record
            const [saleResult] = await db.execute(`
                INSERT INTO sales (
                    sale_number, customer_id, user_id, subtotal, tax_amount, 
                    discount_amount, total_amount, payment_method, payment_reference, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                sale_number, customer_id, req.user.id, subtotal, tax_amount,
                discount_amount, total_amount, payment_method, payment_reference, notes
            ]);

            const sale_id = saleResult.insertId;

            // Create sale items and update inventory
            for (const item of items) {
                const itemTotal = item.unit_price * item.quantity;

                // Get product cost price
                const [productData] = await db.execute(
                    'SELECT cost_price FROM products WHERE id = ?',
                    [item.product_id]
                );
                const cost_price = productData[0]?.cost_price || 0;
                const profit = itemTotal - (cost_price * item.quantity);

                // Create sale item
                await db.execute(`
                    INSERT INTO sale_items (
                        sale_id, product_id, quantity, unit_price, total_price, cost_price, profit
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [sale_id, item.product_id, item.quantity, item.unit_price, itemTotal, cost_price, profit]);

                // Update product stock
                await db.execute(`
                    UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
                `, [item.quantity, item.product_id]);

                // Create inventory transaction
                await db.execute(`
                    INSERT INTO inventory_transactions (
                        product_id, transaction_type, quantity, reference_type, reference_id, user_id
                    ) VALUES (?, 'out', ?, 'sale', ?, ?)
                `, [item.product_id, item.quantity, sale_id, req.user.id]);
            }

            // Update customer loyalty points and total purchases
            if (customer_id) {
                await db.execute(`
                    UPDATE customers SET 
                        loyalty_points = loyalty_points + ?,
                        total_purchases = total_purchases + ?
                    WHERE id = ?
                `, [Math.floor(total_amount / 10), total_amount, customer_id]);
            }

            await db.commit();

            res.status(201).json({
                sale_id,
                sale_number,
                total_amount,
                message: 'Sale completed successfully'
            });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reports API
app.get('/api/reports/sales', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, customer_id, user_id } = req.query;
        
        let query = `
            SELECT s.*, c.name as customer_name, u.username as cashier_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(s.sale_date) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(s.sale_date) <= ?';
            params.push(end_date);
        }

        if (customer_id) {
            query += ' AND s.customer_id = ?';
            params.push(customer_id);
        }

        if (user_id) {
            query += ' AND s.user_id = ?';
            params.push(user_id);
        }

        query += ' ORDER BY s.sale_date DESC';

        const [sales] = await db.execute(query, params);
        res.json({ sales });

    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/reports/inventory', authenticateToken, async (req, res) => {
    try {
        const [inventory] = await db.execute(`
            SELECT 
                p.id,
                p.product_code,
                p.name,
                p.barcode,
                p.price,
                p.stock_quantity,
                p.reorder_level,
                c.name as category_name,
                CASE 
                    WHEN p.stock_quantity = 0 THEN 'Out of Stock'
                    WHEN p.stock_quantity <= p.reorder_level THEN 'Low Stock'
                    ELSE 'In Stock'
                END as stock_status
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
            ORDER BY p.name
        `);

        res.json({ inventory });

    } catch (error) {
        console.error('Inventory report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Categories API
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.execute(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json({ categories });
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Today's sales
        const [todaySales] = await db.execute(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
            FROM sales 
            WHERE DATE(sale_date) = ? AND payment_status = 'completed'
        `, [today]);

        // Week sales
        const [weekSales] = await db.execute(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
            FROM sales 
            WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
            AND payment_status = 'completed'
        `);

        // Month sales
        const [monthSales] = await db.execute(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
            FROM sales 
            WHERE MONTH(sale_date) = MONTH(CURDATE()) 
            AND YEAR(sale_date) = YEAR(CURDATE())
            AND payment_status = 'completed'
        `);

        // Low stock items
        const [lowStock] = await db.execute(`
            SELECT COUNT(*) as count
            FROM products 
            WHERE stock_quantity <= reorder_level AND is_active = TRUE
        `);

        // Out of stock items
        const [outOfStock] = await db.execute(`
            SELECT COUNT(*) as count
            FROM products 
            WHERE stock_quantity = 0 AND is_active = TRUE
        `);

        // Total products
        const [totalProducts] = await db.execute(`
            SELECT COUNT(*) as count FROM products WHERE is_active = TRUE
        `);

        // Total customers
        const [totalCustomers] = await db.execute(`
            SELECT COUNT(*) as count FROM customers WHERE is_active = TRUE
        `);

        res.json({
            todaySales: todaySales[0],
            weekSales: weekSales[0],
            monthSales: monthSales[0],
            inventory: {
                lowStock: lowStock[0].count,
                outOfStock: outOfStock[0].count,
                totalProducts: totalProducts[0].count
            },
            totalCustomers: totalCustomers[0].count
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`POS Server running on port ${PORT}`);
        console.log(`API Documentation: http://localhost:${PORT}/api`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
