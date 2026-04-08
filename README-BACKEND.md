# POS System Backend Setup

A complete backend database system for the Student Point of Sale application with MySQL database and RESTful API.

## Features

### Database Schema
- **Users Management**: Role-based authentication (Admin, Manager, Cashier)
- **Product Management**: Full CRUD with categorization and inventory tracking
- **Customer Management**: Customer profiles with loyalty points system
- **Sales Processing**: Complete sales workflow with payment tracking
- **Inventory Management**: Real-time stock tracking with transaction history
- **Reporting System**: Comprehensive sales and inventory reports
- **Supplier Management**: Supplier information and relationships

### API Endpoints
- **Authentication**: Login/logout with JWT tokens
- **Products**: CRUD operations with search and pagination
- **Customers**: Customer management with loyalty tracking
- **Sales**: Sales processing and transaction management
- **Reports**: Sales, inventory, and analytics reports
- **Dashboard**: Real-time statistics and KPIs

## Database Structure

### Core Tables

#### Users
```sql
- id (Primary Key)
- username (Unique)
- password (Hashed)
- email (Unique)
- role (admin/manager/cashier)
- full_name
- phone
- created_at/updated_at
```

#### Products
```sql
- id (Primary Key)
- product_code (Unique)
- name
- category_id (Foreign Key)
- barcode (Unique)
- description
- price/cost_price
- stock_quantity
- reorder_level/min_stock_level/max_stock_level
- unit
- is_active
- supplier_id (Foreign Key)
```

#### Customers
```sql
- id (Primary Key)
- customer_code (Unique)
- name/email/phone
- address/city/country
- loyalty_points
- total_purchases
- credit_limit/current_balance
- is_active
```

#### Sales
```sql
- id (Primary Key)
- sale_number (Unique)
- customer_id (Foreign Key)
- user_id (Foreign Key)
- subtotal/tax_amount/discount_amount/total_amount
- payment_method (cash/paystack/card/mobile_money)
- payment_reference
- payment_status
- sale_date
```

## Installation & Setup

### Prerequisites
- Node.js 14+ 
- MySQL 8.0+
- npm or yarn

### Step 1: Install Dependencies
```bash
cd pos5
npm install
```

### Step 2: Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
```

### Step 3: Initialize Database
```bash
# Run database initialization
npm run init-db

# Seed with sample data (optional)
npm run seed
```

### Step 4: Start Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Environment Variables

Create `.env` file with:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=pos_system

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=3000

# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_live_ac50bb69405548b385982fc3639348a1570e0dc5
PAYSTACK_SECRET_KEY=your-paystack-secret-key-here
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@pos.com",
    "role": "admin",
    "full_name": "System Administrator"
  }
}
```

### Products API

#### Get Products
```http
GET /products?search=laptop&category=1&page=1&limit=50
Authorization: Bearer {token}
```

#### Create Product
```http
POST /products
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_code": "P001",
  "name": "Laptop Computer",
  "category_id": 1,
  "barcode": "1234567890123",
  "price": 3500.00,
  "cost_price": 2800.00,
  "stock_quantity": 15,
  "reorder_level": 5
}
```

### Customers API

#### Get Customers
```http
GET /customers?search=john&page=1&limit=50
Authorization: Bearer {token}
```

#### Create Customer
```http
POST /customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0201234567",
  "address": "123 Main St, Accra"
}
```

### Sales API

#### Create Sale
```http
POST /sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": 1,
  "payment_method": "paystack",
  "payment_reference": "paystack_ref_123",
  "discount_amount": 0,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 3500.00
    }
  ]
}
```

### Reports API

#### Sales Report
```http
GET /reports/sales?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
```

#### Inventory Report
```http
GET /reports/inventory
Authorization: Bearer {token}
```

### Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer {token}
```

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Token expiration management

### Data Validation
- Input sanitization
- SQL injection prevention
- Request validation

### Security Headers
- CORS configuration
- Helmet.js security headers
- Rate limiting

## Sample Data

The system includes sample data:
- **15 Products** across different categories
- **5 Customers** with loyalty points
- **3 Suppliers** with contact information
- **5 Sample Sales** with various payment methods

### Default Login
- **Username**: admin
- **Password**: admin123
- **Role**: Administrator

## Development

### Project Structure
```
pos5/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env.example             # Environment template
├── scripts/
│   ├── init-database.js    # Database initialization
│   └── seed-data.js       # Sample data seeding
├── main.html               # Frontend application
├── pos.js                  # Frontend JavaScript
├── api-config.js           # API configuration
└── README-BACKEND.md       # This file
```

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server with auto-restart
npm run init-db        # Initialize database tables
npm run seed           # Seed database with sample data
```

## Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure MySQL database
3. Install PM2 for process management
4. Set up reverse proxy (nginx)
5. Configure SSL certificate

### PM2 Configuration
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "pos-backend"

# Monitor
pm2 monit
```

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MySQL service
sudo systemctl status mysql

# Check credentials
mysql -u username -p -h localhost
```

#### Port Already in Use
```bash
# Find process using port 3000
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>
```

#### JWT Token Issues
- Check JWT_SECRET in .env
- Verify token expiration
- Check Authorization header format

## API Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error description",
  "status": 400
}
```

### Pagination Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

## Features for Enhancement

### Planned Additions
- **Multi-store Support**: Manage multiple store locations
- **Advanced Reporting**: Custom report builder
- **API Rate Limiting**: Enhanced security
- **Data Export**: CSV/PDF export functionality
- **Real-time Updates**: WebSocket integration
- **Audit Trail**: Complete activity logging
- **Backup System**: Automated database backups

## Support

For technical support:
1. Check server logs: `console.log` output
2. Verify database connection
3. Test API endpoints with Postman/curl
4. Review environment configuration

## License

This project is licensed under the MIT License - see the main project repository for details.
