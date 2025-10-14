import { useState, useEffect } from 'react';
import { Edit2, Trash2, X, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../api/client';
import ProjectForm from '../components/ProjectForm';
import ProjectDetail from './ProjectDetail';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('self');
  const [currentUser, setCurrentUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // ソート機能を追加
  const [sortConfig, setSortConfig] = useState({ 
    key: null, 
    direction: 'asc' 
  });

  // 検索・フィルター機能を追加
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await api.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProjects = async (userId = 'self', usersData = null) => {
    setLoading(true);
    try {
      let response;
      
      // usersDataが渡されていない場合は、現在のstateのusersを使用
      const usersList = usersData || users;
      
      // 管理者の場合の処理
      if (currentUser?.role === 'admin' && userId !== 'self') {
        if (userId === 'all') {
          response = await api.getProjectsByUser(0);  // 0 = 全ユーザー
        } else {
          response = await api.getProjectsByUser(parseInt(userId));
        }
      } else {
        // 通常の自分の工事を取得
        response = await api.getProjects();
      }
      
      const projectsData = response.data;
      
      // 各プロジェクトの粗利率を計算
      const projectsWithProfit = await Promise.all(
        projectsData.map(async (project) => {
          const costsRes = await api.getCosts({ project_id: project.id });
          const projectCosts = costsRes.data.filter(c => c.project_id === project.id);
          const totalCost = projectCosts.reduce((sum, cost) => sum + cost.amount, 0);
          const contractAmount = project.contract_amount || 0;
          const grossProfit = contractAmount - totalCost;
          const grossProfitRate = contractAmount > 0 ? (grossProfit / contractAmount * 100) : 0;
          
          // ユーザー名を追加（管理者の全体表示用）
          const projectUser = usersList.find(u => u.id === project.user_id);
          
          return {
            ...project,
            totalCost,
            grossProfit,
            grossProfitRate: grossProfitRate.toFixed(1),
            userName: projectUser?.name || '',
            userStaffCode: projectUser?.staff_code || ''
          };
        })
      );
      
      setProjects(projectsWithProfit);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      // 現在のユーザー情報を取得
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        // 管理者の場合はユーザー一覧を取得してから工事を取得
        if (user.role === 'admin') {
          const usersData = await fetchUsers();
          fetchProjects('self', usersData);
        } else {
          // 一般ユーザーも自分の情報を配列にして渡す
          fetchProjects('self', [user]);
        }
      } else {
        fetchProjects();
      }
    };
    
    initializeData();
    fetchCustomers();
  }, []);

  // ユーザー選択が変更されたときの処理
  const handleUserChange = (userId) => {
    setSelectedUserId(userId);
    fetchProjects(userId, users);
  };

  // ソート関数を追加

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
      return response.data; // ユーザーデータを返す
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // ソート関数を追加
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ソートされたプロジェクトリストを作成
  const getSortedProjects = () => {
    if (!sortConfig.key) return projects;
    
    const sorted = [...projects].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // null/undefinedの処理
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // 文字列の比較（大文字小文字を無視）
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase(), 'ja');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      // 数値の比較
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // フィルター処理
  const getFilteredProjects = () => {
    let filtered = getSortedProjects();
    
    if (searchTerm) {
      filtered = filtered.filter(project => {
        // 表示用の完全な工事番号を生成
        const fullProjectCode = project.period && project.userStaffCode
          ? `${String(project.period).padStart(2, '0')}${project.userStaffCode}-${project.project_code}`
          : project.project_code;
        
        return project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              fullProjectCode?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    // 開始日フィルター
    if (startDateFrom) {
      filtered = filtered.filter(project => 
        project.start_date && project.start_date >= startDateFrom
      );
    }
    if (startDateTo) {
      filtered = filtered.filter(project => 
        project.start_date && project.start_date <= startDateTo
      );
    }
    
    // 金額フィルター
    if (amountFrom) {
      filtered = filtered.filter(project => 
        project.contract_amount >= parseInt(amountFrom)
      );
    }
    if (amountTo) {
      filtered = filtered.filter(project => 
        project.contract_amount <= parseInt(amountTo)
      );
    }
    
    return filtered;
  };

  // ソートアイコンの表示
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />;
  };

// 編集モーダルを開く
  const handleEdit = (project, e) => {
    e.stopPropagation();
    
    // 他のユーザーの工事を編集する場合の警告
    if (currentUser && project.user_id !== currentUser.id) {
      const projectUser = users.find(u => u.id === project.user_id);
      if (!confirm(`この工事は${projectUser?.name || '他のユーザー'}さんが作成したものです。本当に編集しますか？`)) {
        return;
      }
    }
    
    setEditingProject({
      ...project,
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // 編集を保存
// 編集を保存
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editingProject,
        contract_amount: editingProject.contract_amount ? parseInt(editingProject.contract_amount) : 0,
        start_date: editingProject.start_date || null,
        end_date: editingProject.end_date || null
      };
      
      await api.updateProject(editingProject.id, updateData);
      alert('更新しました');
      fetchProjects(selectedUserId, users);
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('更新に失敗しました');
    }
  };

  // 削除
  const handleDelete = async (id, name, project, e) => {
    e.stopPropagation();
    let confirmMessage = `「${name}」を削除してもよろしいですか？\n関連する原価データも確認してください。`;
    // 他のユーザーの工事を削除する場合の強い警告
    if (currentUser && project.user_id !== currentUser.id) {
      const projectUser = users.find(u => u.id === project.user_id);
      confirmMessage = `⚠️ この工事は${projectUser?.name || '他のユーザー'}さんが作成したものです。\n削除すると復元できません。\n\n本当に「${name}」を削除しますか？`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await api.deleteProject(id);
      alert('削除しました');
      fetchProjects(selectedUserId, users);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('削除に失敗しました');
    }
  };

  // 詳細画面から戻る
  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  // 詳細画面を表示
  if (selectedProjectId) {
    return (
      <ProjectDetail 
        projectId={selectedProjectId} 
        onBack={handleBackToList} 
      />
    );
  }

  const filteredProjects = getFilteredProjects();

  return (
    <div className="space-y-6">
      {/* 新規工事登録（折りたたみ可能） */}
      <div className="bg-white rounded-lg shadow">
        <div 
          onClick={() => setShowNewForm(!showNewForm)}
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold text-gray-800">
            新規工事登録
          </h2>
          {showNewForm ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {showNewForm && (
          <div className="border-t">
            <ProjectForm onSuccess={() => {
              fetchProjects();
              setShowNewForm(false);
            }} />
          </div>
        )}
      </div>

      {/* 工事一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">📋 工事一覧</h2>
            
            {/* 管理者用のユーザー選択 */}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">表示:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="self">自分の工事</option>
                  <option value="all">全ユーザー</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                      {user.staff_code && ` (${user.staff_code})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

            {/* 検索・フィルター */}
            <div className="mb-4">
              {/* フィルター開閉ボタン */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
              >
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                検索・フィルター {filteredProjects.length !== projects.length && `(${filteredProjects.length}件)`}
              </button>
              
              {showFilters && (
                <div className="space-y-3 bg-gray-50 p-4 rounded border">
                  {/* 検索バー */}
                  <div className="flex gap-2">

              <input
                type="text"
                placeholder="工事名・顧客名・工事番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setStartDateFrom('');
                  setStartDateTo('');
                  setAmountFrom('');
                  setAmountTo('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                クリア
              </button>
            </div>
            
            {/* フィルター */}
            <div className="flex flex-wrap gap-3">
              {/* ステータスフィルター */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="all">全ステータス</option>
                  <option value="active">進行中</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">中止</option>
                </select>
              </div>
              
              {/* 開始日範囲 */}
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDateFrom}
                  onChange={(e) => setStartDateFrom(e.target.value)}
                  className="px-2 py-1 border rounded"
                  placeholder="開始日から"
                />
                <span>〜</span>
                <input
                  type="date"
                  value={startDateTo}
                  onChange={(e) => setStartDateTo(e.target.value)}
                  className="px-2 py-1 border rounded"
                  placeholder="開始日まで"
                />
              </div>
              
              {/* 金額範囲 */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  className="w-32 px-2 py-1 border rounded"
                  placeholder="金額から"
                />
                <span>〜</span>
                <input
                  type="number"
                  value={amountTo}
                  onChange={(e) => setAmountTo(e.target.value)}
                  className="w-32 px-2 py-1 border rounded"
                  placeholder="金額まで"
                />
              </div>
            </div>
          {/* 検索結果数 */}
                <div className="text-sm text-gray-600">
                  検索結果: {filteredProjects.length}件
                </div>
              </div>
            )}
          </div>

          
          {/* テーブル */}
          {loading ? (
            <p className="text-center py-4 text-gray-500">読み込み中...</p>
          ) : filteredProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('project_code')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        工事番号
                        {getSortIcon('project_code')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        工事名
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('client_name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        顧客名
                        {getSortIcon('client_name')}
                      </div>
                    </th>
                    {selectedUserId === 'all' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        作成者
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      受注金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      開始日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      粗利率
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      onClick={() => setSelectedProjectId(project.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.period && project.userStaffCode
                          ? `${String(project.period).padStart(2, '0')}${project.userStaffCode}-${project.project_code}`
                          : project.project_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.client_name || '-'}
                      </td>
                      {selectedUserId === 'all' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.userName || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        ¥{(project.contract_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status === 'active' ? '進行中' : 
                           project.status === 'completed' ? '完了' : '中止'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-sm font-bold rounded ${
                          project.grossProfitRate >= 30 ? 'bg-green-100 text-green-800' :
                          project.grossProfitRate >= 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {project.grossProfitRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={(e) => handleEdit(project, e)}
                          className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded mr-2"
                          title="編集"
                        >
                          編集
                        </button>
                        <button
                          onClick={(e) => handleDelete(project.id, project.name, project, e)}
                          className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                          title="削除"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              まだプロジェクトがありません。上の新規工事登録から追加してください。
            </p>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">工事情報を編集</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工事番号
                  </label>
                  <input
                    type="text"
                    value={editingProject.project_code}
                    onChange={(e) => setEditingProject({...editingProject, project_code: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工事名
                  </label>
                  <input
                    type="text"
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顧客名
                  </label>
                  <input
                    type="text"
                    list="customer-list-edit"
                    value={editingProject.client_name || ''}
                    onChange={(e) => setEditingProject({...editingProject, client_name: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="選択または入力"
                  />
                  <datalist id="customer-list-edit">
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.name} />
                    ))}
                  </datalist>
                </div>

                {/* 見積番号（追加） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    見積番号
                  </label>
                  <input
                    type="text"
                    value={editingProject.estimate_number || ''}
                    onChange={(e) => setEditingProject({...editingProject, estimate_number: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例: Q-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    受注金額（円）
                  </label>
                  <input
                    type="number"
                    value={editingProject.contract_amount || ''}
                    onChange={(e) => setEditingProject({...editingProject, contract_amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日
                  </label>
                  <input
                    type="date"
                    value={editingProject.start_date || ''}
                    onChange={(e) => setEditingProject({...editingProject, start_date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了予定日
                  </label>
                  <input
                    type="date"
                    value={editingProject.end_date || ''}
                    onChange={(e) => setEditingProject({...editingProject, end_date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="active">進行中</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">中止</option>
                  </select>
                </div>
              </div>

              {/* メモ（追加） - 全幅使用 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={editingProject.notes || ''}
                  onChange={(e) => setEditingProject({...editingProject, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="工事に関するメモ・備考など"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;