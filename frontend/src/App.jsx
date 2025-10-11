// frontend/src/App.jsx - スーパー管理者対応版
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import CostManagement from './pages/CostManagement';
import BusinessPartners from './pages/BusinessPartners';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import UserManagement from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import Register from './pages/Register';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    // URLパスをチェック
    const path = window.location.pathname;
    
    // スーパー管理者ルートの場合
    if (path.startsWith('/super-admin')) {
      const superToken = localStorage.getItem('super_token');
      const superAdminData = localStorage.getItem('super_admin');
      
      if (superToken && superAdminData) {
        setIsSuperAdmin(true);
        setIsLoggedIn(true);
      }
    } else {
      // 通常ユーザーのログイン状態をチェック
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const companyData = localStorage.getItem('company');
      
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
        if (companyData) {
          setCompany(JSON.parse(companyData));
        }
      }
    }
  }, []);

  const handleLogin = (data) => {
    setIsLoggedIn(true);
    if (data.is_super_admin) {
      setIsSuperAdmin(true);
    } else {
      setUser(data.user);
      setCompany(data.company);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('super_token');
    localStorage.removeItem('super_admin');
    setIsLoggedIn(false);
    setIsSuperAdmin(false);
    setUser(null);
    setCompany(null);
    window.location.href = '/';
  };

  // スーパー管理者ルート
  if (window.location.pathname.startsWith('/super-admin')) {
    if (!isLoggedIn) {
      return <SuperAdminLogin onLogin={handleLogin} />;
    }
    return <SuperAdminDashboard />;
  }

  // 新規登録ルート
  if (window.location.pathname === '/register') {
    return <Register onRegisterSuccess={() => window.location.href = '/'} />;
  }

  // 通常ユーザーログインチェック
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user?.role === 'admin';

  const tabs = isAdmin ? [
    { id: 'dashboard', name: 'ダッシュボード', component: AdminDashboard },
    { id: 'projects', name: '工事台帳', component: ProjectList },
    { id: 'cost-management', name: '原価管理', component: CostManagement },
    { id: 'business-partners', name: '取引先管理', component: BusinessPartners },
    { id: 'user-management', name: 'ユーザー管理', component: UserManagement },
    { id: 'settings', name: '設定', component: Settings },
  ] : [
    { id: 'dashboard', name: 'ダッシュボード', component: Dashboard },
    { id: 'projects', name: '工事台帳', component: ProjectList },
    { id: 'cost-management', name: '原価管理', component: CostManagement },
    { id: 'business-partners', name: '取引先管理', component: BusinessPartners },
    { id: 'settings', name: '設定', component: Settings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">⚡ 工事原価管理</h1>
              {company && (
                <p className="text-sm text-gray-600">{company.name}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* スーパー管理者へのリンク */}
              <a
                href="/super-admin"
                className="text-xs text-gray-500 hover:text-gray-700"
                title="スーパー管理画面"
              >
                🛡️
              </a>
              <span className="text-sm text-gray-700">
                {user?.name} ({user?.role === 'admin' ? '管理者' : 'ユーザー'})
              </span>
              <button
                onClick={handleLogout}
                className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* タブメニュー */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default App;