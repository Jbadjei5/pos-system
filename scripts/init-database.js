const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
    try {
        // Connect to MySQL without database first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8mb4'
        });

        console.log('Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'pos_system'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database ${process.env.DB_NAME || 'pos_system'} created or already exists`);

        // Close connection and reconnect to the specific database
        await connection.end();

        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pos_system',
            charset: 'utf8mb4'
        });

        console.log('Connected to POS database');

        // Create tables
        await createTables(db);

        // Create default admin user
        await createDefaultAdmin(db);

        await db.end();
        console.log('Database initialization completed successfully');

    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

async function createTables(db) {
    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            role ENUM('admin', 'manager', 'cashier') DEFAULT 'cashier',
            full_name VARCHAR(100),
            phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Categories table
        `CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Products table
        `CREATE TABLE IF NOT EXISTS products (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Customers table
        `CREATE TABLE IF NOT EXISTS customers (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Sales table
        `CREATE TABLE IF NOT EXISTS sales (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Sale items table
        `CREATE TABLE IF NOT EXISTS sale_items (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Inventory transactions table
        `CREATE TABLE IF NOT EXISTS inventory_transactions (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        // Suppliers table
        `CREATE TABLE IF NOT EXISTS suppliers (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const table of tables) {
        await db.execute(table);
    }

    console.log('All tables created successfully');
}

async function createDefaultAdmin(db) {
    try {
        // Check if admin user exists
        const [existingAdmin] = await db.execute(
            'SELECT id FROM users WHERE role = ? LIMIT 1',
            ['admin']
        );

        if (existingAdmin.length === 0) {
            // Create default admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await db.execute(`
                INSERT INTO users (username, password, email, role, full_name) 
                VALUES (?, ?, ?, ?, ?)
            `, ['admin', hashedPassword, 'admin@pos.com', 'admin', 'System Administrator']);

            console.log('Default admin user created: username=admin, password=admin123');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Run initialization
initializeDatabase();
