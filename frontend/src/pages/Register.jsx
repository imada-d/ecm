// frontend/src/pages/Register.jsx
import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/client';

function Register({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    username: '',
    name: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/company-register`, {
        company_name: formData.company_name,
        email: formData.email,
        admin_username: formData.username,
        admin_password: formData.password
      });
      alert(`登録完了！会社コード: ${response.data.company_code}`);
      onRegisterSuccess();
    } catch (error) {
      alert('登録失敗: ' + error.response?.data?.detail);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚡ 工事原価管理</h1>
          <p className="text-sm text-gray-600 mt-2">電気工事業向け原価管理システム</p>
        </div>

        <h2 className="text-xl font-semibold mb-6">新規会社登録</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              type="text"
              placeholder="会社名"
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              placeholder="メールアドレス"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              管理者ユーザーID
            </label>
            <input
              type="text"
              placeholder="管理者ユーザーID"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              管理者名
            </label>
            <input
              type="text"
              placeholder="管理者名"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              placeholder="パスワード"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            登録
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-500 hover:text-blue-600 text-sm">
            ログインに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

export default Register;