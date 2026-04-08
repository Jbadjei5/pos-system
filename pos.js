// POS System JavaScript
// Student Project - Point of Sale System

// Global Variables
let products = [];
let cart = [];
let customers = [];
let sales = [];
let inventory = [];
let currentPaymentMethod = '';
let editingProductId = null;
let editingCustomerId = null;

// Paystack Configuration
const PAYSTACK_PUBLIC_KEY = 'pk_live_ac50bb69405548b385982fc3639348a1570e0dc5';

// Initialize the POS System
document.addEventListener('DOMContentLoaded', function() {
    initializePOS();
    loadSampleData();
    setupEventListeners();
    updateDashboard();
});

function initializePOS() {
    // Load data from localStorage or initialize with empty arrays
    products = JSON.parse(localStorage.getItem('products')) || [];
    customers = JSON.parse(localStorage.getItem('customers')) || [];
    sales = JSON.parse(localStorage.getItem('sales')) || [];
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    
    // Set current date for reports
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    document.getElementById('productReportStart').value = today;
    document.getElementById('productReportEnd').value = today;
    document.getElementById('customerReportStart').value = today;
    document.getElementById('customerReportEnd').value = today;
}

function loadSampleData() {
    // Load sample products if empty
    if (products.length === 0) {
        products = [
            {
                id: 'P001',
                name: 'Laptop Computer',
                category: 'Electronics',
                price: 3500.00,
                stock: 15,
                barcode: '1234567890123',
                reorderLevel: 5
            },
            {
                id: 'P002',
                name: 'Wireless Mouse',
                category: 'Electronics',
                price: 45.50,
                stock: 25,
                barcode: '2345678901234',
                reorderLevel: 10
            },
            {
                id: 'P003',
                name: 'USB Keyboard',
                category: 'Electronics',
                price: 85.00,
                stock: 20,
                barcode: '3456789012345',
                reorderLevel: 8
            },
            {
                id: 'P004',
                name: 'Bottled Water',
                category: 'Beverages',
                price: 2.50,
                stock: 100,
                barcode: '4567890123456',
                reorderLevel: 20
            },
            {
                id: 'P005',
                name: 'Notebook',
                category: 'Stationery',
                price: 12.00,
                stock: 50,
                barcode: '5678901234567',
                reorderLevel: 15
            },
            {
                id: 'P006',
                name: 'Pen Set',
                category: 'Stationery',
                price: 8.50,
                stock: 30,
                barcode: '6789012345678',
                reorderLevel: 10
            },
            {
                id: 'P007',
                name: 'T-Shirt',
                category: 'Clothing',
                price: 35.00,
                stock: 40,
                barcode: '7890123456789',
                reorderLevel: 12
            },
            {
                id: 'P008',
                name: 'Jeans',
                category: 'Clothing',
                price: 75.00,
                stock: 25,
                barcode: '8901234567890',
                reorderLevel: 8
            }
        ];
        saveProducts();
    }

    // Load sample customers if empty
    if (customers.length === 0) {
        customers = [
            {
                id: 'C001',
                name: 'John Doe',
                phone: '0201234567',
                email: 'john@example.com',
                address: '123 Main St, Accra',
                loyaltyPoints: 150,
                totalPurchases: 1250.00
            },
            {
                id: 'C002',
                name: 'Jane Smith',
                phone: '0249876543',
                email: 'jane@example.com',
                address: '456 Oak Ave, Kumasi',
                loyaltyPoints: 300,
                totalPurchases: 2800.00
            }
        ];
        saveCustomers();
    }
}

function setupEventListeners() {
    // Product search
    document.getElementById('productSearch').addEventListener('input', function(e) {
        filterProducts(e.target.value);
    });

    // Barcode input
    document.getElementById('barcodeInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const barcode = e.target.value.trim();
            if (barcode) {
                addProductByBarcode(barcode);
                e.target.value = '';
            }
        }
    });

    // Product management search
    document.getElementById('productSearchManage').addEventListener('input', function(e) {
        filterProductsTable(e.target.value);
    });

    // Customer search
    document.getElementById('customerSearch').addEventListener('input', function(e) {
        filterCustomers(e.target.value);
    });

    // Inventory search
    document.getElementById('inventorySearch').addEventListener('input', function(e) {
        filterInventory(e.target.value);
    });

    // Cash received calculation
    document.getElementById('cashReceived').addEventListener('input', calculateChange);

    // Filter change listeners
    document.getElementById('categoryFilter').addEventListener('change', filterProductsTable);
    document.getElementById('stockFilter').addEventListener('change', filterProductsTable);
    document.getElementById('inventoryCategoryFilter').addEventListener('change', filterInventory);
    document.getElementById('stockLevelFilter').addEventListener('change', filterInventory);
}

// Navigation
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(section + '-section').classList.add('active');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load section-specific data
    switch(section) {
        case 'sales':
            loadProductGrid();
            loadCustomerSelect();
            break;
        case 'products':
            loadProductsTable();
            loadCategoryFilters();
            break;
        case 'inventory':
            loadInventoryTable();
            updateInventoryStats();
            break;
        case 'customers':
            loadCustomersTable();
            break;
        case 'reports':
            updateReportStats();
            break;
    }
}

// Product Management
function loadProductGrid() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        if (product.stock > 0) {
            const card = document.createElement('div');
            card.className = 'col-md-3 mb-3';
            card.innerHTML = `
                <div class="card product-card" onclick="addToCart('${product.id}')">
                    <div class="card-body text-center">
                        <i class="fas fa-box fa-3x mb-2 text-primary"></i>
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text">
                            <strong>₵${product.price.toFixed(2)}</strong><br>
                            <small>Stock: ${product.stock}</small>
                        </p>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

function filterProducts(searchTerm) {
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
    );
    
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    filtered.forEach(product => {
        if (product.stock > 0) {
            const card = document.createElement('div');
            card.className = 'col-md-3 mb-3';
            card.innerHTML = `
                <div class="card product-card" onclick="addToCart('${product.id}')">
                    <div class="card-body text-center">
                        <i class="fas fa-box fa-3x mb-2 text-primary"></i>
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text">
                            <strong>₵${product.price.toFixed(2)}</strong><br>
                            <small>Stock: ${product.stock}</small>
                        </p>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

function addProductByBarcode(barcode) {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
        addToCart(product.id);
    } else {
        showNotification('Product not found with barcode: ' + barcode, 'danger');
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock === 0) {
        showNotification('Product is out of stock', 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showNotification('Not enough stock available', 'warning');
            return;
        }
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            barcode: product.barcode
        });
    }
    
    updateCart();
    showNotification('Product added to cart', 'success');
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>₵${item.price.toFixed(2)} x ${item.quantity}</small>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="updateQuantity(${index}, 1)">+</button>
                    <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="text-end">
                <strong>₵${itemTotal.toFixed(2)}</strong>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Update totals
    const tax = subtotal * 0.125; // 12.5% VAT
    const discount = 0; // Will be updated when discount is applied
    const total = subtotal + tax - discount;
    
    document.getElementById('subtotal').textContent = `₵${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `₵${tax.toFixed(2)}`;
    document.getElementById('discount').textContent = `₵${discount.toFixed(2)}`;
    document.getElementById('total').textContent = `₵${total.toFixed(2)}`;
}

function updateQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(index);
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
        updateCart();
    } else {
        showNotification('Not enough stock available', 'warning');
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function clearCart() {
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        updateCart();
    }
}

// Payment Processing
function processPayment() {
    if (cart.length === 0) {
        showNotification('Cart is empty', 'warning');
        return;
    }
    
    // Generate order summary
    const summary = document.getElementById('paymentOrderSummary');
    let summaryHTML = '<table class="table table-sm">';
    summaryHTML += '<thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        summaryHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₵${item.price.toFixed(2)}</td>
                <td>₵${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.125;
    const total = subtotal + tax;
    
    summaryHTML += `
        <tr class="table-primary">
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>₵${total.toFixed(2)}</strong></td>
        </tr>
    </tbody></table>`;
    
    summary.innerHTML = summaryHTML;
    
    // Show payment modal
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

function selectPaymentMethod(method) {
    currentPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Show/hide payment fields
    document.getElementById('cashPaymentFields').style.display = method === 'cash' ? 'block' : 'none';
    document.getElementById('paystackPaymentFields').style.display = method === 'paystack' ? 'block' : 'none';
}

function calculateChange() {
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    const total = parseFloat(document.getElementById('total').textContent.replace('₵', ''));
    const change = cashReceived - total;
    
    document.getElementById('changeAmount').textContent = change.toFixed(2);
}

function completePayment() {
    const total = parseFloat(document.getElementById('total').textContent.replace('₵', ''));
    
    // Validate payment based on method
    if (currentPaymentMethod === 'cash') {
        const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
        if (cashReceived < total) {
            showNotification('Insufficient cash received', 'danger');
            return;
        }
        processSale();
    } else if (currentPaymentMethod === 'paystack') {
        const email = document.getElementById('paystackEmail').value;
        
        if (!email) {
            showNotification('Please provide email address for Paystack payment', 'danger');
            return;
        }
        
        // Test if Paystack is available
        console.log('Testing Paystack availability...');
        console.log('PaystackPop type:', typeof PaystackPop);
        console.log('PaystackPop object:', PaystackPop);
        
        // Initialize Paystack payment
        initializePaystackPayment(email, total);
    } else {
        showNotification('Please select a payment method', 'danger');
    }
}

function initializePaystackPayment(email, amount) {
    // Check if Paystack is loaded
    if (typeof PaystackPop === 'undefined') {
        showNotification('Paystack payment gateway is not loaded. Please refresh the page and try again.', 'danger');
        return;
    }
    
    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100, // Convert to kobo (Paystack expects amount in kobo)
        currency: 'GHS',
        ref: 'POS_' + Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response) {
            // Payment successful
            console.log('Paystack payment successful:', response);
            showNotification('Paystack payment successful!', 'success');
            processSale(response.reference);
        },
        onClose: function() {
            // Payment modal closed
            console.log('Paystack payment closed');
            showNotification('Payment cancelled', 'warning');
        }
    });
    
    console.log('Opening Paystack payment...');
    handler.openIframe();
}

function processSale(paymentReference = null) {
    const total = parseFloat(document.getElementById('total').textContent.replace('₵', ''));
    
    // Process the sale
    const sale = {
        id: 'S' + Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        tax: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.125,
        total: total,
        paymentMethod: currentPaymentMethod,
        paymentReference: paymentReference,
        customerId: document.getElementById('customerSelect').value || null
    };
    
    // Update product stock
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Update customer loyalty points if applicable
    const customerId = document.getElementById('customerSelect').value;
    if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customer.loyaltyPoints += Math.floor(total / 10); // 1 point per ₵10
            customer.totalPurchases += total;
        }
    }
    
    // Save data
    sales.push(sale);
    saveProducts();
    saveCustomers();
    saveSales();
    
    // Generate receipt
    generateReceipt(sale);
    
    // Clear cart and close modal
    cart = [];
    updateCart();
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    
    // Show receipt modal
    const receiptModal = new bootstrap.Modal(document.getElementById('receiptModal'));
    receiptModal.show();
    
    showNotification('Payment completed successfully', 'success');
}

// Receipt Generation
function generateReceipt(sale) {
    const receiptContent = document.getElementById('receiptContent');
    const customer = customers.find(c => c.id === sale.customerId);
    
    let receiptHTML = `
        <div class="receipt-header">
            <h4>Student POS System</h4>
            <p>123 University Street, Accra, Ghana</p>
            <p>Tel: +233 20 123 4567</p>
        </div>
        
        <div class="receipt-details">
            <p><strong>Receipt No:</strong> ${sale.id}</p>
            <p><strong>Date:</strong> ${new Date(sale.date).toLocaleString()}</p>
            <p><strong>Cashier:</strong> System User</p>
            ${customer ? `<p><strong>Customer:</strong> ${customer.name}</p>` : ''}
            <hr>
            
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    sale.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        receiptHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₵${item.price.toFixed(2)}</td>
                <td>₵${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    receiptHTML += `
                </tbody>
            </table>
            
            <hr>
            <div class="text-end">
                <p><strong>Subtotal:</strong> ₵${sale.subtotal.toFixed(2)}</p>
                <p><strong>Tax (12.5%):</strong> ₵${sale.tax.toFixed(2)}</p>
                <p><strong>Total:</strong> ₵${sale.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}</p>
                ${sale.paymentReference ? `<p><strong>Payment Reference:</strong> ${sale.paymentReference}</p>` : ''}
            </div>
            
            <hr>
            <div class="text-center">
                <p>Thank you for your purchase!</p>
                <p>Please come again</p>
            </div>
        </div>
    `;
    
    receiptContent.innerHTML = receiptHTML;
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { text-align: left; padding: 5px; }
                    hr { margin: 10px 0; }
                </style>
            </head>
            <body>
                ${receiptContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Product Management Functions
function loadProductsTable() {
    const table = document.getElementById('productsTable');
    table.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₵${product.price.toFixed(2)}</td>
            <td>
                ${product.stock}
                ${product.stock <= product.reorderLevel ? '<span class="badge bg-warning ms-1">Low</span>' : ''}
            </td>
            <td>${product.barcode}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function filterProductsTable(searchTerm) {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    
    let filtered = products;
    
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    if (stockFilter) {
        if (stockFilter === 'low') {
            filtered = filtered.filter(product => product.stock <= product.reorderLevel && product.stock > 0);
        } else if (stockFilter === 'out') {
            filtered = filtered.filter(product => product.stock === 0);
        }
    }
    
    const table = document.getElementById('productsTable');
    table.innerHTML = '';
    
    filtered.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₵${product.price.toFixed(2)}</td>
            <td>
                ${product.stock}
                ${product.stock <= product.reorderLevel ? '<span class="badge bg-warning ms-1">Low</span>' : ''}
            </td>
            <td>${product.barcode}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function showAddProductModal() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    
    // Generate new product ID
    const newId = 'P' + String(products.length + 1).padStart(3, '0');
    document.getElementById('productName').focus();
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productBarcode').value = product.barcode;
    document.getElementById('productReorderLevel').value = product.reorderLevel;
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function saveProduct() {
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const barcode = document.getElementById('productBarcode').value;
    const reorderLevel = parseInt(document.getElementById('productReorderLevel').value);
    
    if (!name || !category || !price || !stock) {
        showNotification('Please fill in all required fields', 'danger');
        return;
    }
    
    if (editingProductId) {
        // Update existing product
        const product = products.find(p => p.id === editingProductId);
        product.name = name;
        product.category = category;
        product.price = price;
        product.stock = stock;
        product.barcode = barcode;
        product.reorderLevel = reorderLevel;
    } else {
        // Add new product
        const newProduct = {
            id: 'P' + String(products.length + 1).padStart(3, '0'),
            name: name,
            category: category,
            price: price,
            stock: stock,
            barcode: barcode || generateBarcode(),
            reorderLevel: reorderLevel
        };
        products.push(newProduct);
    }
    
    saveProducts();
    loadProductsTable();
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    showNotification('Product saved successfully', 'success');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        saveProducts();
        loadProductsTable();
        showNotification('Product deleted successfully', 'success');
    }
}

function generateBarcode() {
    return Math.random().toString().substr(2, 13);
}

// Customer Management Functions
function loadCustomerSelect() {
    const select = document.getElementById('customerSelect');
    select.innerHTML = '<option value="">Walk-in Customer</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.loyaltyPoints} points)`;
        select.appendChild(option);
    });
}

function loadCustomersTable() {
    const table = document.getElementById('customersTable');
    table.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email}</td>
            <td><span class="loyalty-points">${customer.loyaltyPoints}</span></td>
            <td>₵${customer.totalPurchases.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editCustomer('${customer.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function filterCustomers(searchTerm) {
    const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const table = document.getElementById('customersTable');
    table.innerHTML = '';
    
    filtered.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email}</td>
            <td><span class="loyalty-points">${customer.loyaltyPoints}</span></td>
            <td>₵${customer.totalPurchases.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editCustomer('${customer.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function showAddCustomerModal() {
    editingCustomerId = null;
    document.getElementById('customerModalTitle').textContent = 'Add Customer';
    document.getElementById('customerForm').reset();
    
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    modal.show();
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    editingCustomerId = customerId;
    document.getElementById('customerModalTitle').textContent = 'Edit Customer';
    
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerEmail').value = customer.email;
    document.getElementById('customerAddress').value = customer.address;
    
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    modal.show();
}

function saveCustomer() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const email = document.getElementById('customerEmail').value;
    const address = document.getElementById('customerAddress').value;
    
    if (!name || !phone) {
        showNotification('Please fill in all required fields', 'danger');
        return;
    }
    
    if (editingCustomerId) {
        // Update existing customer
        const customer = customers.find(c => c.id === editingCustomerId);
        customer.name = name;
        customer.phone = phone;
        customer.email = email;
        customer.address = address;
    } else {
        // Add new customer
        const newCustomer = {
            id: 'C' + String(customers.length + 1).padStart(3, '0'),
            name: name,
            phone: phone,
            email: email,
            address: address,
            loyaltyPoints: 0,
            totalPurchases: 0
        };
        customers.push(newCustomer);
    }
    
    saveCustomers();
    loadCustomersTable();
    loadCustomerSelect();
    bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
    showNotification('Customer saved successfully', 'success');
}

function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers = customers.filter(c => c.id !== customerId);
        saveCustomers();
        loadCustomersTable();
        loadCustomerSelect();
        showNotification('Customer deleted successfully', 'success');
    }
}

// Inventory Management Functions
function loadInventoryTable() {
    const table = document.getElementById('inventoryTable');
    table.innerHTML = '';
    
    products.forEach(product => {
        const totalValue = product.price * product.stock;
        const status = getStockStatus(product.stock, product.reorderLevel);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>${product.reorderLevel}</td>
            <td>₵${product.price.toFixed(2)}</td>
            <td>₵${totalValue.toFixed(2)}</td>
            <td><span class="badge bg-${status.color}">${status.text}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="adjustStock('${product.id}')">
                    <i class="fas fa-edit"></i> Adjust
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function getStockStatus(stock, reorderLevel) {
    if (stock === 0) {
        return { color: 'danger', text: 'Out of Stock' };
    } else if (stock <= reorderLevel) {
        return { color: 'warning', text: 'Low Stock' };
    } else {
        return { color: 'success', text: 'In Stock' };
    }
}

function filterInventory(searchTerm) {
    const categoryFilter = document.getElementById('inventoryCategoryFilter').value;
    const stockLevelFilter = document.getElementById('stockLevelFilter').value;
    
    let filtered = products;
    
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    if (stockLevelFilter) {
        if (stockLevelFilter === 'low') {
            filtered = filtered.filter(product => product.stock <= 10);
        } else if (stockLevelFilter === 'medium') {
            filtered = filtered.filter(product => product.stock > 10 && product.stock <= 50);
        } else if (stockLevelFilter === 'high') {
            filtered = filtered.filter(product => product.stock > 50);
        }
    }
    
    const table = document.getElementById('inventoryTable');
    table.innerHTML = '';
    
    filtered.forEach(product => {
        const totalValue = product.price * product.stock;
        const status = getStockStatus(product.stock, product.reorderLevel);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>${product.reorderLevel}</td>
            <td>₵${product.price.toFixed(2)}</td>
            <td>₵${totalValue.toFixed(2)}</td>
            <td><span class="badge bg-${status.color}">${status.text}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="adjustStock('${product.id}')">
                    <i class="fas fa-edit"></i> Adjust
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function adjustStock(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newStock = prompt(`Enter new stock quantity for ${product.name} (Current: ${product.stock}):`, product.stock);
    
    if (newStock !== null && !isNaN(newStock)) {
        product.stock = parseInt(newStock);
        saveProducts();
        loadInventoryTable();
        updateInventoryStats();
        showNotification('Stock updated successfully', 'success');
    }
}

function updateInventoryStats() {
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock <= p.reorderLevel && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('outOfStockCount').textContent = outOfStockCount;
    document.getElementById('totalValue').textContent = `₵${totalValue.toFixed(2)}`;
}

function exportInventory() {
    let csv = 'Product Name,Category,Current Stock,Reorder Level,Unit Price,Total Value,Status\n';
    
    products.forEach(product => {
        const totalValue = product.price * product.stock;
        const status = getStockStatus(product.stock, product.reorderLevel);
        
        csv += `"${product.name}","${product.category}",${product.stock},${product.reorderLevel},${product.price},${totalValue},"${status.text}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification('Inventory exported successfully', 'success');
}

// Reporting Functions
function updateReportStats() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const todaySales = sales.filter(s => new Date(s.date) >= todayStart)
        .reduce((sum, s) => sum + s.total, 0);
    const weekSales = sales.filter(s => new Date(s.date) >= weekStart)
        .reduce((sum, s) => sum + s.total, 0);
    const monthSales = sales.filter(s => new Date(s.date) >= monthStart)
        .reduce((sum, s) => sum + s.total, 0);
    
    document.getElementById('todaySales').textContent = `₵${todaySales.toFixed(2)}`;
    document.getElementById('weekSales').textContent = `₵${weekSales.toFixed(2)}`;
    document.getElementById('monthSales').textContent = `₵${monthSales.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = sales.length;
}

function generateDailyReport() {
    const reportDate = document.getElementById('reportDate').value;
    const date = new Date(reportDate + 'T00:00:00');
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    
    const daySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= date && saleDate < nextDate;
    });
    
    const totalSales = daySales.reduce((sum, s) => sum + s.total, 0);
    const totalItems = daySales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    let reportHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Daily Sales Report - ${reportDate}</h5>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>${daySales.length}</h5>
                                <p class="mb-0">Transactions</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>₵${totalSales.toFixed(2)}</h5>
                                <p class="mb-0">Total Sales</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>${totalItems}</h5>
                                <p class="mb-0">Items Sold</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>₵${daySales.length > 0 ? (totalSales / daySales.length).toFixed(2) : '0.00'}</h5>
                                <p class="mb-0">Average Sale</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h6>Transaction Details</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Receipt #</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    daySales.forEach(sale => {
        const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        reportHTML += `
            <tr>
                <td>${new Date(sale.date).toLocaleTimeString()}</td>
                <td>${sale.id}</td>
                <td>${itemCount}</td>
                <td>₵${sale.total.toFixed(2)}</td>
                <td>${sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}</td>
            </tr>
        `;
    });
    
    reportHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('dailyReportContent').innerHTML = reportHTML;
}

function generateProductReport() {
    const startDate = document.getElementById('productReportStart').value;
    const endDate = document.getElementById('productReportEnd').value;
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    const periodSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end;
    });
    
    // Calculate product performance
    const productStats = {};
    
    periodSales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productStats[item.productId]) {
                const product = products.find(p => p.id === item.productId);
                productStats[item.productId] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productStats[item.productId].quantity += item.quantity;
            productStats[item.productId].revenue += item.price * item.quantity;
        });
    });
    
    // Sort by revenue
    const sortedProducts = Object.entries(productStats)
        .sort((a, b) => b[1].revenue - a[1].revenue);
    
    let reportHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Product Performance Report (${startDate} to ${endDate})</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity Sold</th>
                                <th>Revenue</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    sortedProducts.forEach(([productId, stats]) => {
        const performance = stats.revenue > 1000 ? 'Excellent' : 
                           stats.revenue > 500 ? 'Good' : 
                           stats.revenue > 100 ? 'Average' : 'Poor';
        const performanceColor = stats.revenue > 1000 ? 'success' : 
                                stats.revenue > 500 ? 'info' : 
                                stats.revenue > 100 ? 'warning' : 'danger';
        
        reportHTML += `
            <tr>
                <td>${stats.name}</td>
                <td>${stats.quantity}</td>
                <td>₵${stats.revenue.toFixed(2)}</td>
                <td><span class="badge bg-${performanceColor}">${performance}</span></td>
            </tr>
        `;
    });
    
    reportHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('productReportContent').innerHTML = reportHTML;
}

function generateInventoryReport() {
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stock <= p.reorderLevel && p.stock > 0);
    const outOfStockItems = products.filter(p => p.stock === 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    let reportHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Inventory Report</h5>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>${totalProducts}</h5>
                                <p class="mb-0">Total Products</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>${lowStockItems.length}</h5>
                                <p class="mb-0">Low Stock Items</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>${outOfStockItems.length}</h5>
                                <p class="mb-0">Out of Stock</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5>₵${totalInventoryValue.toFixed(2)}</h5>
                                <p class="mb-0">Total Value</p>
                            </div>
                        </div>
                    </div>
                </div>
    `;
    
    if (lowStockItems.length > 0) {
        reportHTML += `
            <h6 class="text-warning">Low Stock Alert</h6>
            <div class="table-responsive mb-3">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Current Stock</th>
                            <th>Reorder Level</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        lowStockItems.forEach(product => {
            reportHTML += `
                <tr class="table-warning">
                    <td>${product.name}</td>
                    <td>${product.stock}</td>
                    <td>${product.reorderLevel}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adjustStock('${product.id}')">
                            <i class="fas fa-edit"></i> Restock
                        </button>
                    </td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (outOfStockItems.length > 0) {
        reportHTML += `
            <h6 class="text-danger">Out of Stock Items</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Last Known Stock</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        outOfStockItems.forEach(product => {
            reportHTML += `
                <tr class="table-danger">
                    <td>${product.name}</td>
                    <td>0</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="adjustStock('${product.id}')">
                            <i class="fas fa-edit"></i> Restock
                        </button>
                    </td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    reportHTML += `
            </div>
        </div>
    `;
    
    document.getElementById('inventoryReportContent').innerHTML = reportHTML;
}

function generateCustomerReport() {
    const startDate = document.getElementById('customerReportStart').value;
    const endDate = document.getElementById('customerReportEnd').value;
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    const periodSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end;
    });
    
    // Calculate customer statistics
    const customerStats = {};
    
    customers.forEach(customer => {
        customerStats[customer.id] = {
            name: customer.name,
            phone: customer.phone,
            loyaltyPoints: customer.loyaltyPoints,
            totalPurchases: customer.totalPurchases,
            periodPurchases: 0,
            periodTransactions: 0
        };
    });
    
    periodSales.forEach(sale => {
        if (sale.customerId) {
            customerStats[sale.customerId].periodPurchases += sale.total;
            customerStats[sale.customerId].periodTransactions += 1;
        }
    });
    
    // Sort by period purchases
    const sortedCustomers = Object.entries(customerStats)
        .sort((a, b) => b[1].periodPurchases - a[1].periodPurchases);
    
    let reportHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Customer Report (${startDate} to ${endDate})</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Loyalty Points</th>
                                <th>Total Purchases</th>
                                <th>Period Purchases</th>
                                <th>Period Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    sortedCustomers.forEach(([customerId, stats]) => {
        reportHTML += `
            <tr>
                <td>${stats.name}</td>
                <td>${stats.phone}</td>
                <td><span class="loyalty-points">${stats.loyaltyPoints}</span></td>
                <td>₵${stats.totalPurchases.toFixed(2)}</td>
                <td>₵${stats.periodPurchases.toFixed(2)}</td>
                <td>${stats.periodTransactions}</td>
            </tr>
        `;
    });
    
    reportHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('customerReportContent').innerHTML = reportHTML;
}

// Utility Functions
function loadCategoryFilters() {
    const categories = [...new Set(products.map(p => p.category))];
    const categoryFilter = document.getElementById('categoryFilter');
    const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
    
    // Clear existing options (except the first one)
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }
    while (inventoryCategoryFilter.children.length > 1) {
        inventoryCategoryFilter.removeChild(inventoryCategoryFilter.lastChild);
    }
    
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;
        categoryFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category;
        option2.textContent = category;
        inventoryCategoryFilter.appendChild(option2);
    });
}

function applyDiscount() {
    const discountPercentage = prompt('Enter discount percentage (0-100):', '0');
    
    if (discountPercentage !== null && !isNaN(discountPercentage)) {
        const discount = parseFloat(discountPercentage);
        
        if (discount < 0 || discount > 100) {
            showNotification('Invalid discount percentage', 'danger');
            return;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.125;
        const discountAmount = subtotal * (discount / 100);
        const total = subtotal + tax - discountAmount;
        
        document.getElementById('discount').textContent = `₵${discountAmount.toFixed(2)}`;
        document.getElementById('total').textContent = `₵${total.toFixed(2)}`;
        
        showNotification(`Discount of ${discount}% applied`, 'success');
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function updateDashboard() {
    loadProductGrid();
    loadCustomerSelect();
    updateInventoryStats();
    updateReportStats();
}

// Data Persistence Functions
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

function saveCustomers() {
    localStorage.setItem('customers', JSON.stringify(customers));
}

function saveSales() {
    localStorage.setItem('sales', JSON.stringify(sales));
}

// Initialize on load
window.addEventListener('load', function() {
    showSection('sales');
});
