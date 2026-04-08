const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function seedDatabase() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pos_system',
            charset: 'utf8mb4'
        });

        console.log('Connected to database for seeding');

        // Insert categories
        console.log('Seeding categories...');
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

        // Get category IDs
        const [categories] = await db.execute('SELECT id, name FROM categories');
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });

        // Insert products
        console.log('Seeding products...');
        const products = [
            ['P001', 'Laptop Computer', categoryMap['Electronics'], '1234567890123', 'High-performance laptop for professionals', 3500.00, 2800.00, 15, 5],
            ['P002', 'Wireless Mouse', categoryMap['Electronics'], '2345678901234', 'Ergonomic wireless mouse', 45.50, 35.00, 25, 10],
            ['P003', 'USB Keyboard', categoryMap['Electronics'], '3456789012345', 'Mechanical keyboard with RGB', 85.00, 65.00, 20, 8],
            ['P004', 'Bottled Water', categoryMap['Food & Beverages'], '4567890123456', 'Pure mineral water 500ml', 2.50, 1.50, 100, 20],
            ['P005', 'Notebook', categoryMap['Stationery'], '5678901234567', 'A4 ruled notebook 200 pages', 12.00, 8.00, 50, 15],
            ['P006', 'Pen Set', categoryMap['Stationery'], '6789012345678', 'Set of 5 ballpoint pens', 8.50, 5.00, 30, 10],
            ['P007', 'T-Shirt', categoryMap['Clothing'], '7890123456789', 'Cotton t-shirt various colors', 35.00, 20.00, 40, 12],
            ['P008', 'Jeans', categoryMap['Clothing'], '8901234567890', 'Denim jeans classic fit', 75.00, 45.00, 25, 8],
            ['P009', 'Smartphone', categoryMap['Electronics'], '9012345678901', 'Latest smartphone model', 2500.00, 2000.00, 10, 3],
            ['P010', 'Headphones', categoryMap['Electronics'], '0123456789012', 'Noise-cancelling headphones', 150.00, 120.00, 18, 5],
            ['P011', 'Coffee', categoryMap['Food & Beverages'], '1234567890123', 'Premium coffee beans 1kg', 45.00, 30.00, 30, 10],
            ['P012', 'Backpack', categoryMap['Other'], '2345678901234', 'Durable backpack for students', 65.00, 40.00, 20, 8],
            ['P013', 'Calculator', categoryMap['Stationery'], '3456789012345', 'Scientific calculator', 25.00, 18.00, 35, 12],
            ['P014', 'Sneakers', categoryMap['Clothing'], '4567890123456', 'Comfortable sports sneakers', 120.00, 80.00, 15, 6],
            ['P015', 'Energy Drink', categoryMap['Food & Beverages'], '5678901234567', 'Energy drink 250ml', 8.00, 5.00, 60, 15]
        ];

        for (const product of products) {
            await db.execute(`
                INSERT IGNORE INTO products (
                    product_code, name, category_id, barcode, description, 
                    price, cost_price, stock_quantity, reorder_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, product);
        }

        // Insert customers
        console.log('Seeding customers...');
        const customers = [
            ['John Doe', 'john@example.com', '0201234567', '123 Main St, Accra', 'Accra', 'Ghana', '1990-01-15', 'male'],
            ['Jane Smith', 'jane@example.com', '0249876543', '456 Oak Ave, Kumasi', 'Kumasi', 'Ghana', '1992-05-22', 'female'],
            ['Kwame Asante', 'kwame@example.com', '0234567890', '789 Market St, Tema', 'Tema', 'Ghana', '1988-11-30', 'male'],
            ['Ama Mensah', 'ama@example.com', '0278901234', '321 Freedom Ave, Takoradi', 'Takoradi', 'Ghana', '1995-08-17', 'female'],
            ['Kojo Johnson', 'kojo@example.com', '0267890123', '654 Independence Rd, Cape Coast', 'Cape Coast', 'Ghana', '1991-03-25', 'male']
        ];

        for (const [name, email, phone, address, city, country, dob, gender] of customers) {
            const customer_code = `CUST${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
            await db.execute(`
                INSERT IGNORE INTO customers (
                    customer_code, name, email, phone, address, city, country, date_of_birth, gender
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [customer_code, name, email, phone, address, city, country, dob, gender]);
        }

        // Insert suppliers
        console.log('Seeding suppliers...');
        const suppliers = [
            ['SUP001', 'Tech Solutions Ltd', 'Kwame Tech', 'info@techsolutions.com', '0301234567', '123 Tech Park, Accra', 'Accra', 'Ghana', 'GH123456789', 'Net 30 days'],
            ['SUP002', 'Food Distributors Ghana', 'Ama Food', 'sales@fooddist.com.gh', '0312345678', '456 Market Rd, Kumasi', 'Kumasi', 'Ghana', 'GH987654321', 'Cash on delivery'],
            ['SUP003', 'Fashion House', 'Kofi Fashion', 'contact@fashionhouse.com', '0323456789', '789 Style Ave, Accra', 'Accra', 'Ghana', 'GH456789123', 'Net 15 days']
        ];

        for (const supplier of suppliers) {
            await db.execute(`
                INSERT IGNORE INTO suppliers (
                    supplier_code, name, contact_person, email, phone, address, city, country, 
                    tax_identification_number, payment_terms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, supplier);
        }

        // Create some sample sales
        console.log('Seeding sample sales...');
        const [productList] = await db.execute('SELECT id, price FROM products ORDER BY RAND() LIMIT 5');
        const [customerList] = await db.execute('SELECT id FROM customers ORDER BY RAND() LIMIT 3');
        const [userList] = await db.execute('SELECT id FROM users WHERE role = "cashier" LIMIT 2');

        if (productList.length > 0 && customerList.length > 0 && userList.length > 0) {
            for (let i = 0; i < 5; i++) {
                const randomProduct = productList[Math.floor(Math.random() * productList.length)];
                const randomCustomer = customerList[Math.floor(Math.random() * customerList.length)];
                const randomUser = userList[Math.floor(Math.random() * userList.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const unitPrice = parseFloat(randomProduct.price);
                const subtotal = unitPrice * quantity;
                const taxAmount = subtotal * 0.125;
                const totalAmount = subtotal + taxAmount;

                const saleNumber = `SALE${new Date().toISOString().replace(/[-T:]/g, '').substr(2, 8)}${String(i + 1).padStart(3, '0')}`;

                // Insert sale
                const [saleResult] = await db.execute(`
                    INSERT INTO sales (
                        sale_number, customer_id, user_id, subtotal, tax_amount, 
                        total_amount, payment_method, payment_status
                    ) VALUES (?, ?, ?, ?, ?, ?, 'cash', 'completed')
                `, [saleNumber, randomCustomer.id, randomUser.id, subtotal, taxAmount, totalAmount]);

                // Insert sale item
                await db.execute(`
                    INSERT INTO sale_items (
                        sale_id, product_id, quantity, unit_price, total_price
                    ) VALUES (?, ?, ?, ?, ?)
                `, [saleResult.insertId, randomProduct.id, quantity, unitPrice, subtotal]);

                // Update product stock
                await db.execute(`
                    UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
                `, [quantity, randomProduct.id]);

                // Update customer purchases
                await db.execute(`
                    UPDATE customers SET 
                        total_purchases = total_purchases + ?,
                        loyalty_points = loyalty_points + ?
                    WHERE id = ?
                `, [totalAmount, Math.floor(totalAmount / 10), randomCustomer.id]);
            }
        }

        await db.end();
        console.log('Database seeding completed successfully!');
        console.log('\nSample Login Credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('\nSample Data Created:');
        console.log('- 15 Products');
        console.log('- 5 Customers');
        console.log('- 3 Suppliers');
        console.log('- 5 Sample Sales');

    } catch (error) {
        console.error('Database seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
