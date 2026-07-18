import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params) => api.get('/api/inventory', { params }),
  getById: (id) => api.get(`/api/inventory/${id}`),
  create: (data) => api.post('/api/inventory', data),
  update: (id, data) => api.put(`/api/inventory/${id}`, data),
  delete: (id) => api.delete(`/api/inventory/${id}`),
  updateQuantity: (id, quantity) => api.patch(`/api/inventory/${id}/quantity`, { quantity }),
  // one-time migration: sets costPrice on items that have 0
  migrateCostPrice: (marginPct = 40) => api.post('/api/inventory/migrate/set-cost-price', { marginPct }),
};

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/api/sales', { params }),
  getById: (id) => api.get(`/api/sales/${id}`),
  create: (data) => api.post('/api/sales', data),
  delete: (id) => api.delete(`/api/sales/${id}`),
};

// Upload API
export const uploadAPI = {
  // Upload an image file — returns { imageUrl, filename, size }
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/api/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Delete an uploaded image by filename
  deleteImage: (filename) => api.delete(`/api/upload/image/${filename}`),
  // Helper: resolve full URL for an imageUrl path stored in DB
  getImageUrl: (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;     // external URL — use as-is
    return `${API_BASE_URL}${imageUrl}`;                  // local /uploads/... path
  },
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params) => api.get('/api/analytics/overview', { params }),
  getSalesByDate: (params) => api.get('/api/analytics/sales-by-date', { params }),
  getTopProducts: (params) => api.get('/api/analytics/top-products', { params }),
  getByCategory: (params) => api.get('/api/analytics/by-category', { params }),
  getLowStock: (params) => api.get('/api/analytics/low-stock', { params }),
};

export default api;
