// frontend/src/api/client.js

import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 認証トークンをヘッダーに追加するインターセプター
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401エラー時の処理を追加
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // トークンが無効な場合はログイン画面に戻す
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const api = {
  // プロジェクト関連
  getProjects: () => client.get('/api/projects'),
  getProjectById: (id) => client.get(`/api/projects/${id}`),
  createProject: (data) => client.post('/api/projects', data),
  updateProject: (id, data) => client.put(`/api/projects/${id}`, data),
  deleteProject: (id) => client.delete(`/api/projects/${id}`),
  
  // 原価関連
  getCosts: (params) => client.get('/api/costs', { params }),
  createCost: (data) => client.post('/api/costs', data),
  updateCost: (id, data) => client.put(`/api/costs/${id}`, data),
  deleteCost: (id) => client.delete(`/api/costs/${id}`),
  
  // 業者関連
  getVendors: () => client.get('/api/vendors'),
  createVendor: (data) => client.post('/api/vendors', data),
  updateVendor: (id, data) => client.put(`/api/vendors/${id}`, data),
  deleteVendor: (id) => client.delete(`/api/vendors/${id}`),

  // 顧客関連
  getCustomers: () => client.get('/api/customers'),
  createCustomer: (data) => client.post('/api/customers', data),
  updateCustomer: (id, data) => client.put(`/api/customers/${id}`, data),
  deleteCustomer: (id) => client.delete(`/api/customers/${id}`),
  
  // カテゴリ関連
  getCategories: () => client.get('/api/categories'),
  createCategory: (data) => client.post('/api/categories', data),
  updateCategory: (id, data) => client.put(`/api/categories/${id}`, data),
  deleteCategory: (id) => client.delete(`/api/categories/${id}`),
  
// ダッシュボード関連
  getDashboard: () => client.get('/api/dashboard'),
  getDashboardSummary: (params) => client.get('/api/dashboard/summary', { params }),
  getMonthlySummary: () => client.get('/api/summary/monthly'),
  getRanking: () => client.get('/api/summary/ranking'),
  getDashboardAll: () => client.get('/api/dashboard/all'),
  getDashboardMy: () => client.get('/api/dashboard/my'),
  getDashboardUsers: () => client.get('/api/dashboard/users'),
  
// 設定関連
  getSettings: () => client.get('/api/settings'),
  getSetting: (key) => client.get(`/api/settings/${key}`),
  updateSetting: (key, data) => client.put(`/api/settings/${key}`, data),

// ユーザー管理関連
  getUsers: () => client.get('/api/users'),
  createUser: (data) => client.post('/api/users', data),
  updateUser: (id, data) => client.put(`/api/users/${id}`, data),
  deleteUser: (id) => client.delete(`/api/users/${id}`),

// ユーザー別工事取得
getProjectsByUser: (userId) => client.get(`/api/projects/by-user/${userId}`),

// 期の設定関連
getFiscalSettings: () => client.get('/api/settings/fiscal'),
updateFiscalSettings: (data) => client.put('/api/settings/fiscal', data),

// 帳票テンプレート関連
getPrintTemplate: () => client.get('/api/settings/print-template'),
updatePrintTemplate: (data) => client.put('/api/settings/print-template', data),

};

// default export として出力
export default api;

// named export も提供（他のコンポーネントが {api} でインポートしている場合のため）
export { api };