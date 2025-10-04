// frontend/src/pages/SuperAdminDashboard.jsx - スーパー管理者ダッシュボード
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Users, Building, Database, Trash2, 
  Download, Activity, HardDrive, LogOut,
  CheckCircle, XCircle, AlertCircle, Package
} from 'lucide-react';

function SuperAdminDashboard() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('companies');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    company_code: '',
    admin_email: '',
    admin_password: '',
    admin_name: '',
    plan_type: 'free'
  });

  // 🔥 apiインスタンスを削除して、関数に変更
  const getApi = () => {
    return axios.create({
      baseURL: 'http://localhost:8000/api/super',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('super_token')}`
      }
    });
  };

    useEffect(() => {
        fetchData();
    }, []);

  async function fetchData() {
        setLoading(true);
        try {
            const api = getApi(); // 🔥 ここで最新のトークンを取得
            const [companiesRes, statsRes, backupsRes] = await Promise.all([
                api.get('/companies'),
                api.get('/stats'),
                api.get('/backups')
            ]);
            setCompanies(companiesRes.data);
            setStats(statsRes.data);
            setBackups(backupsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }

    const fetchCompanyUsers = async (companyId) => {
        try {
        const api = getApi(); // 🔥 追加
        const res = await api.get(`/companies/${companyId}/users`);
        setCompanyUsers(res.data);
        setSelectedCompany(companyId);
        } catch (error) {
        console.error('Error fetching users:', error);
        }
    };

    const toggleCompanyActive = async (companyId) => {
        if (confirm('この会社の有効/無効を切り替えますか？')) {
        try {
            const api = getApi(); // 🔥 追加
            await api.put(`/companies/${companyId}/toggle-active`);
            fetchData();
        } catch (error) {
            alert('エラーが発生しました');
        }
        }
    };

    const updateCompanyPlan = async (companyId) => {
        const plan = prompt('プランを選択 (free/paid/premium):');
        if (!plan) return;
        
        const maxUsers = parseInt(prompt('最大ユーザー数:') || '5');
        const storageLimit = parseInt(prompt('容量制限(MB):') || '100');
        
        try {
        const api = getApi(); // 🔥 追加
        await api.put(`/companies/${companyId}/plan`, null, {
            params: { 
            plan_type: plan, 
            max_users: maxUsers, 
            storage_limit_mb: storageLimit 
            }
        });
        alert('プランを更新しました');
        fetchData();
        } catch (error) {
        alert('エラーが発生しました');
        }
    };

    const deleteCompany = async (companyId, companyName) => {
        const confirmation = prompt(`会社「${companyName}」を完全削除します。\n確認のため会社名を入力してください:`);
        if (confirmation !== companyName) {
        alert('会社名が一致しません');
        return;
        }
        
        try {
        const api = getApi(); // 🔥 追加
        await api.delete(`/companies/${companyId}`);
        alert('会社を完全削除しました');
        fetchData();
        } catch (error) {
        alert('削除に失敗しました');
        }
    };



    
    const resetUserPassword = async (userId, username, name) => {
      const newPassword = prompt(`${name}（${username}）の新しいパスワードを入力してください:`, 'password123');
      if (!newPassword) return;
      
      if (!confirm(`パスワードを「${newPassword}」にリセットしますか？`)) return;
      
      try {
        const api = getApi();
        const res = await api.post(`/users/${userId}/reset-password?new_password=${newPassword}`);
        
        alert(`✅ パスワードをリセットしました！\n\nユーザー: ${res.data.username}\n新パスワード: ${res.data.new_password}\n\n※このパスワードをユーザーに伝えてください`);
      } catch (error) {
        alert('パスワードリセットに失敗しました');
      }
    };

    const createCustomCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.admin_email || !newCompany.admin_password || !newCompany.admin_name) {
        alert('全ての必須項目を入力してください');
        return;
    }

    try {
        const api = getApi();
        // 🔥 空文字の場合は送信しない
        const requestData = {
        name: newCompany.name,
        email: newCompany.admin_email,
        admin_username: newCompany.admin_name,
        admin_password: newCompany.admin_password,
        plan_type: newCompany.plan_type
        };
        
        // company_codeが入力されている場合のみ追加
        if (newCompany.company_code) {
        requestData.company_code = newCompany.company_code;
        }
        
        const res = await api.post('/companies/create', requestData);
        
        alert(`会社を作成しました！\n会社コード: ${res.data.company_code}\nログインURL: ${res.data.company_url}\n\n管理者ログイン情報:\nユーザー名: ${res.data.admin_credentials.username}\nパスワード: ${res.data.admin_credentials.password}`);
        setShowCreateForm(false);
        setNewCompany({
        name: '',
        company_code: '',
        admin_email: '',
        admin_password: '',
        admin_name: '',
        plan_type: 'free'
        });
        fetchData();
    } catch (error) {
        console.error('Error:', error);
        alert(error.response?.data?.detail || '作成に失敗しました');
    }
    };

  const handleLogout = () => {
    localStorage.removeItem('super_token');
    localStorage.removeItem('super_admin');
    window.location.href = '/super-admin';
  };

  const getPlanBadge = (planType) => {
    const badges = {
      'free': 'bg-gray-500',
      'paid': 'bg-blue-500',
      'premium': 'bg-purple-500'
    };
    return badges[planType] || 'bg-gray-500';
  };

  const getStoragePercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
        
        {/* タブ */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-4 border-t border-gray-700 pt-4">
            <button
              onClick={() => setActiveTab('companies')}
              className={`pb-2 px-1 border-b-2 transition ${
                activeTab === 'companies'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              会社管理 ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`pb-2 px-1 border-b-2 transition ${
                activeTab === 'backups'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              バックアップ ({backups.length})
            </button>
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 会社作成ボタン */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">システム統計</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Building className="w-5 h-5" />
            新規会社作成
          </button>
        </div>

        {/* 会社作成フォーム */}
        {showCreateForm && (
          <div className="mb-6 bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">新規会社作成</h3>
            <form onSubmit={createCustomCompany} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">会社名 *</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                  placeholder="株式会社〇〇電工"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  会社コード（空欄でランダム生成）
                </label>
                <input
                  type="text"
                  value={newCompany.company_code}
                  onChange={(e) => setNewCompany({...newCompany, company_code: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                  placeholder="yamada-denki"
                  pattern="[a-z0-9-]+"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">管理者名 *</label>
                <input
                  type="text"
                  value={newCompany.admin_name}
                  onChange={(e) => setNewCompany({...newCompany, admin_name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                  placeholder="山田 太郎"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">管理者メール *</label>
                <input
                  type="email"
                  value={newCompany.admin_email}
                  onChange={(e) => setNewCompany({...newCompany, admin_email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">初期パスワード *</label>
                <input
                  type="text"
                  value={newCompany.admin_password}
                  onChange={(e) => setNewCompany({...newCompany, admin_password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                  placeholder="password123"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">プラン</label>
                <select
                  value={newCompany.plan_type}
                  onChange={(e) => setNewCompany({...newCompany, plan_type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                >
                  <option value="free">無料プラン</option>
                  <option value="paid">有料プラン</option>
                  <option value="premium">プレミアムプラン</option>
                </select>
              </div>
              
              <div className="col-span-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 統計カード */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-gray-400 text-sm">総会社数</p>
                  <p className="text-2xl font-bold">{stats.companies.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-gray-400 text-sm">総ユーザー数</p>
                  <p className="text-2xl font-bold">{stats.users.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-gray-400 text-sm">総容量</p>
                  <p className="text-2xl font-bold">{stats.storage.total_mb}MB</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-gray-400 text-sm">有効会社</p>
                  <p className="text-2xl font-bold">{stats.companies.active}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' ? (
          <div className="space-y-4">
            {companies.map((company) => (
              <div key={company.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{company.name}</h3>
                      <p className="text-xs text-gray-400">コード: {company.company_code}</p>
                      <span className={`px-2 py-1 rounded text-xs text-white ${getPlanBadge(company.plan_type)}`}>
                        {company.plan_type.toUpperCase()}
                      </span>
                      {company.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-400">ID:</span> {company.id}
                      </div>
                      <div>
                        <span className="text-gray-400">ユーザー:</span> {company.user_count}人
                      </div>
                      <div>
                        <span className="text-gray-400">容量:</span> {company.storage_used_mb}/{company.storage_limit_mb}MB
                      </div>
                      <div>
                        <span className="text-gray-400">登録日:</span> {new Date(company.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    
                    {/* 容量バー */}
                    <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{width: `${getStoragePercentage(company.storage_used_mb, company.storage_limit_mb)}%`}}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchCompanyUsers(company.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      ユーザー
                    </button>
                    <button
                      onClick={() => toggleCompanyActive(company.id)}
                      className={`px-3 py-1 rounded text-sm text-white ${
                        company.is_active 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {company.is_active ? '無効化' : '有効化'}
                    </button>
                    <button
                      onClick={() => updateCompanyPlan(company.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                    >
                      プラン変更
                    </button>
                    <button
                      onClick={() => deleteCompany(company.id, company.name)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* ユーザー一覧 */}
                {selectedCompany === company.id && companyUsers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-bold text-gray-400 mb-2">ユーザー一覧</h4>
                    <div className="space-y-2">
                      {companyUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                          <div>
                            <span className="text-white">{user.name}</span>
                            <span className="text-gray-400 ml-2 text-sm">(ID: {user.username})</span>
                            {user.role === 'admin' && (
                              <span className="ml-2 px-2 py-1 bg-yellow-600 text-xs rounded">管理者</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resetUserPassword(user.id, user.username, user.name)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                            >
                              パスワードリセット
                            </button>
                            <div className="text-sm text-gray-400">
                              {user.last_login_at ? 
                                `最終: ${new Date(user.last_login_at).toLocaleDateString('ja-JP')}` : 
                                '未ログイン'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {backups.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400">バックアップはありません</p>
              </div>
            ) : (
              backups.map((backup, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">📦 {backup.folder_name}</p>
                      <p className="text-sm text-gray-400">
                        ファイル数: {backup.file_count}個 | サイズ: {backup.size_mb}MB
                      </p>
                      <p className="text-xs text-gray-500">
                        作成日時: {new Date(backup.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      自動バックアップ
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;