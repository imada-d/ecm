// frontend/src/pages/SuperAdminLogin.jsx - スーパー管理者ログイン画面
import { useState } from 'react';
import axios from 'axios';
import { Shield } from 'lucide-react';

// 環境に応じてAPIのベースURLを自動切り替え
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `http://${window.location.hostname}:8000`;

function SuperAdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/super/login`, null, {
        params: { username, password }
      });
      
      localStorage.setItem('super_token', response.data.access_token);
      localStorage.setItem('super_admin', JSON.stringify(response.data));
      
      onLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Super Admin</h1>
          <p className="text-sm text-gray-400 mt-2">システム管理画面</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500"
              placeholder="superadmin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? '認証中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-yellow-500 hover:text-yellow-400 text-sm">
            ← 通常ログインに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLogin;