// frontend/src/pages/UserManagement.jsx
import { useState, useEffect } from 'react';
import api from '../api/client';
import { Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Shield } from 'lucide-react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 権限のカテゴリと説明
  const permissionCategories = {
    dashboard: {
      label: 'ダッシュボード',
      permissions: {
        view_dashboard: 'ダッシュボード閲覧',
        view_all_stats: '全体統計の閲覧（チェックなしは自分のデータのみ）'
      }
    },
    projects: {
      label: '工事管理',
      permissions: {
        view_projects: '工事一覧の閲覧',
        create_projects: '新規工事の作成',
        edit_projects: '工事情報の編集',
        delete_projects: '工事の削除'
      }
    },
    costs: {
      label: '原価管理',
      permissions: {
        view_costs: '原価データの閲覧',
        create_costs: '原価の入力',
        edit_costs: '原価の編集',
        delete_costs: '原価の削除'
      }
    },
    partners: {
      label: '取引先管理',
      permissions: {
        view_partners: '業者・顧客の閲覧',
        manage_partners: '業者・顧客の追加・編集・削除'
      }
    },
    system: {
      label: 'システム管理',
      permissions: {
        manage_users: 'ユーザー管理',
        manage_settings: 'システム設定の変更',
        export_data: 'データのエクスポート'
      }
    },
    admin: {
      label: '特殊権限',
      permissions: {
        super_admin: '全権限（スーパー管理者）'
      }
    }
  };

  // デフォルト権限
  const getDefaultPermissions = () => {
    const perms = {};
    Object.values(permissionCategories).forEach(category => {
      Object.keys(category.permissions).forEach(key => {
        perms[key] = ['view_dashboard', 'view_projects', 'view_costs', 'view_partners'].includes(key);
      });
    });
    return perms;
  };

  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    password: '',
    staff_code: '',
    permissions: getDefaultPermissions()
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      alert('ユーザーを追加しました');
      setShowAddForm(false);
      setNewUser({
        username: '',
        name: '',
        password: '',
        staff_code: '',
        permissions: getDefaultPermissions()
      });
      fetchUsers();
    } catch (error) {
      alert('追加に失敗しました: ' + (error.response?.data?.detail || error.message));
    }
  };

  const togglePermission = async (userId, permKey, currentPermissions) => {
    const newPermissions = {
      ...currentPermissions,
      [permKey]: !currentPermissions[permKey]
    };
    
    // super_adminがONになったら全権限をONにする
    if (permKey === 'super_admin' && newPermissions.super_admin) {
      Object.keys(newPermissions).forEach(key => {
        newPermissions[key] = true;
      });
    }
    
    try {
      await api.updateUser(userId, { permissions: newPermissions });
      fetchUsers();
    } catch (error) {
      alert('更新に失敗しました: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('このユーザーを削除してもよろしいですか？')) return;
    try {
      await api.deleteUser(userId);
      alert('ユーザーを削除しました');
      fetchUsers();
    } catch (error) {
      alert('削除に失敗しました: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleNewUserPermission = (permKey) => {
    const newPermissions = { ...newUser.permissions };
    newPermissions[permKey] = !newPermissions[permKey];
    
    // super_adminがONになったら全権限をONにする
    if (permKey === 'super_admin' && newPermissions.super_admin) {
      Object.keys(newPermissions).forEach(key => {
        newPermissions[key] = true;
      });
    }
    
    setNewUser({ ...newUser, permissions: newPermissions });
  };

  if (loading) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">👥 ユーザー管理</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showAddForm ? '閉じる' : '＋ ユーザー追加'}
          </button>
        </div>

        {/* 新規ユーザー追加フォーム */}
        {showAddForm && (
          <form onSubmit={handleAddUser} className="mb-6 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-4">新規ユーザー登録</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザーID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    担当者番号
                </label>
                <input
                    type="text"
                    value={newUser.staff_code || ''}
                    onChange={(e) => setNewUser({...newUser, staff_code: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="例: 8"
                />
                </div>
                <div>
                </div>

            {/* 権限設定 */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">権限設定</h4>
              <div className="space-y-3">
                {Object.entries(permissionCategories).map(([catKey, category]) => (
                  <div key={catKey} className="border rounded p-3 bg-white">
                    <h5 className="font-medium text-gray-700 mb-2">{category.label}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(category.permissions).map(([permKey, label]) => (
                        <label key={permKey} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={newUser.permissions[permKey] || false}
                            onChange={() => toggleNewUserPermission(permKey)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                ユーザー追加
              </button>
            </div>
          </form>
        )}

        {/* ユーザー一覧 */}
        <div className="space-y-4">
        {users.map(user => (
            <div key={user.id} className="border rounded-lg">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                <button
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    className="text-gray-600 hover:text-gray-900"
                >
                    {expandedUser === user.id ? <ChevronDown /> : <ChevronRight />}
                </button>
                <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-600">
                    ID: {user.username}
                    {user.staff_code && ` | 担当者番号: ${user.staff_code}`}
                    </div>
                </div>
                {user.permissions?.super_admin && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    スーパー管理者
                    </span>
                )}
                </div>
                <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {user.is_active ? '有効' : '無効'}
                </span>
                <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-500 hover:text-red-700"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                </div>
            </div>

            {/* 権限詳細（展開時） */}
            {expandedUser === user.id && (
                <div className="border-t p-4 bg-gray-50">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    担当者番号
                    </label>
                    <input
                    type="text"
                    value={user.staff_code || ''}
                    onChange={async (e) => {
                        try {
                        await api.updateUser(user.id, { staff_code: e.target.value });
                        fetchUsers();
                        } catch (error) {
                        alert('更新に失敗しました: ' + (error.response?.data?.detail || error.message));
                        }
                    }}
                    className="w-32 p-2 border rounded"
                    placeholder="例: 8"
                    />
                </div>
                
                <h4 className="font-semibold mb-3">権限設定</h4>
                <div className="space-y-3">
                    {Object.entries(permissionCategories).map(([catKey, category]) => (
                    <div key={catKey} className="border rounded p-3 bg-white">
                        <h5 className="font-medium text-gray-700 mb-2">{category.label}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(category.permissions).map(([permKey, label]) => (
                            <label key={permKey} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={user.permissions?.[permKey] || false}
                                onChange={() => togglePermission(user.id, permKey, user.permissions || {})}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">{label}</span>
                            </label>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}
            </div>
        ))}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;