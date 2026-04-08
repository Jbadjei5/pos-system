# Student POS System

A comprehensive Point of Sale (POS) system designed for student projects, featuring a modern web-based interface with full functionality for retail operations.

## Features

### Core Modules

1. **Sales Processing**
   - Product search and barcode scanning
   - Shopping cart management
   - Tax calculation (12.5% VAT)
   - Discount application
   - Multiple payment methods (Cash, Mobile Money, Card)

2. **Product Management**
   - Add, edit, delete products
   - Category management
   - Barcode tracking
   - Stock level monitoring
   - Low stock alerts

3. **Inventory Management**
   - Real-time stock tracking
   - Automatic stock deduction after sales
   - Stock adjustment capabilities
   - Inventory valuation
   - Export functionality

4. **Customer Management**
   - Customer registration and management
   - Loyalty points system
   - Purchase history tracking
   - Customer analytics

5. **Payment Processing**
   - Cash payments with change calculation
   - Mobile money support
   - Credit/debit card processing
   - Split payment capabilities

6. **Reporting & Analytics**
   - Daily/weekly/monthly sales reports
   - Product performance analysis
   - Inventory reports
   - Customer purchase reports
   - Real-time dashboard statistics

7. **Receipt Generation**
   - Automatic receipt creation
   - Printable receipts
   - Transaction details
   - Store information

## Technical Specifications

### Architecture
- **Three-tier architecture:**
  - Presentation Layer: HTML5, CSS3, JavaScript, Bootstrap 5
  - Application Layer: JavaScript business logic
  - Data Layer: LocalStorage for data persistence

### Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **UI Framework:** Bootstrap 5
- **Icons:** Font Awesome 6
- **Data Storage:** LocalStorage (client-side)
- **Currency:** Ghana Cedi (₵)

### Key Features
- Responsive design for all devices
- Real-time inventory updates
- Barcode scanning support
- Multi-payment method support
- Comprehensive reporting
- Customer loyalty program
- Low stock alerts
- Data export functionality

## Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Setup Instructions

1. **Download/Clone the files**
   ```bash
   git clone <repository-url>
   cd pos5
   ```

2. **Open in browser**
   - Simply open `main.html` in your web browser
   - Or use a local server for better development experience:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     
     # Then visit http://localhost:8000
     ```

3. **First Run**
   - The system will automatically load with sample data
   - Products, customers, and sample transactions are pre-loaded
   - All data is stored in browser's LocalStorage

## Usage Guide

### Sales Process
1. **Add Products to Cart**
   - Click on product cards in the grid
   - Use search bar to find products
   - Scan barcode using barcode input field
   - Adjust quantities using +/- buttons

2. **Customer Selection**
   - Select existing customer from dropdown
   - Or proceed with "Walk-in Customer"

3. **Apply Discounts**
   - Click "Apply Discount" button
   - Enter percentage discount

4. **Process Payment**
   - Click "Process Payment"
   - Select payment method (Cash/Mobile Money/Card)
   - Fill in payment details
   - Complete transaction

5. **Receipt Generation**
   - Receipt automatically generated after payment
   - Print or save receipt

### Product Management
1. **Add Products**
   - Navigate to Products section
   - Click "Add Product"
   - Fill in product details
   - Save product

2. **Edit/Delete Products**
   - Use action buttons in product table
   - Edit product details or delete products

### Inventory Management
1. **Monitor Stock Levels**
   - View inventory status in Inventory section
   - Low stock items highlighted
   - Real-time stock updates

2. **Stock Adjustment**
   - Click "Adjust" button for any product
   - Enter new stock quantity
   - Save changes

### Reporting
1. **Generate Reports**
   - Navigate to Reports section
   - Select report type and date range
   - View and analyze data

2. **Export Data**
   - Export inventory to CSV
   - Print reports
   - Save data for analysis

## Data Structure

### Product Schema
```javascript
{
  id: "P001",
  name: "Product Name",
  category: "Category",
  price: 100.00,
  stock: 50,
  barcode: "1234567890123",
  reorderLevel: 10
}
```

### Customer Schema
```javascript
{
  id: "C001",
  name: "Customer Name",
  phone: "0201234567",
  email: "customer@example.com",
  address: "Customer Address",
  loyaltyPoints: 100,
  totalPurchases: 1500.00
}
```

### Sales Schema
```javascript
{
  id: "S1234567890",
  date: "2024-01-01T10:30:00.000Z",
  items: [...],
  subtotal: 1000.00,
  tax: 125.00,
  total: 1125.00,
  paymentMethod: "cash",
  customerId: "C001"
}
```

## Features for Students

### Learning Objectives
- **Database Design:** Understand data relationships and schema design
- **UI/UX Design:** Modern responsive interface development
- **Business Logic:** Implement real-world business processes
- **Data Management:** CRUD operations and data persistence
- **Reporting:** Data analysis and visualization
- **Payment Processing:** Multiple payment gateway integration

### Extension Ideas
- **Backend Integration:** Connect to MySQL/PostgreSQL database
- **User Authentication:** Add login/logout functionality
- **Role Management:** Admin, Manager, Cashier roles
- **Hardware Integration:** Barcode scanners, receipt printers
- **Cloud Storage:** Firebase or other cloud services
- **Mobile App:** React Native or Flutter version
- **Advanced Analytics:** Charts and graphs integration
- **Multi-store Support:** Manage multiple store locations

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Support

For issues, questions, or contributions:
- Check the code comments for detailed explanations
- Review the JavaScript functions for implementation details
- Test all features in different browsers
- Ensure proper data backup before major changes

## License

This project is designed for educational purposes. Feel free to use, modify, and distribute for learning and development.

---

**Note:** This system uses LocalStorage for data persistence. Data is stored locally in the browser and will be cleared if browser data is cleared. For production use, implement proper backend database integration.
