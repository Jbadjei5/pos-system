// API Configuration
const API_CONFIG = {
    BASE_URL: (typeof process !== 'undefined' && process.env.RENDER_API_URL) 
        ? `${process.env.RENDER_API_URL}/api` 
        : 'http://localhost:3000/api',
    TIMEOUT: 10000
};

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/auth/login',
    
    // Products
    PRODUCTS: '/products',
    
    // Customers
    CUSTOMERS: '/customers',
    
    // Sales
    SALES: '/sales',
    
    // Reports
    SALES_REPORT: '/reports/sales',
    INVENTORY_REPORT: '/reports/inventory',
    
    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    
    // Categories
    CATEGORIES: '/categories'
};

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, API_ENDPOINTS, apiCall };
} else {
    window.API_CONFIG = API_CONFIG;
    window.API_ENDPOINTS = API_ENDPOINTS;
    window.apiCall = apiCall;
}
