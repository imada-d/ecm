import { useState, useEffect } from 'react';
import api from '../api/client';

function CostList() {
  const [costs, setCosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // カテゴリごとの色設定
  const categoryColors = {
    '材料費': 'bg-blue-100 text-blue-800',
    '外注費': 'bg-red-100 text-red-800', 
    '経費': 'bg-green-100 text-green-800',
    'その他': 'bg-gray-100 text-gray-800',
    // 新しいカテゴリが追加された場合のデフォルト
    'default': 'bg-purple-100 text-purple-800'
  };

  // カテゴリの色を取得する関数
  const getCategoryColor = (category) => {
    return categoryColors[category] || categoryColors['default'];
  };
  
  // ヘッダーフィルター
  const [headerFilters, setHeaderFilters] = useState({
    date: '',
    project_id: '',
    vendor: '',
    category: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchCosts();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const response = await api.getCosts();
      setCosts(response.data);
    } catch (error) {
      console.error('Error fetching costs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 編集開始
  const handleEdit = (cost) => {
    setEditingCost(cost);
    setEditFormData({
      ...cost,
      date: cost.date.split('T')[0]
    });
  };

  // 編集保存
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editFormData,
        amount: parseInt(editFormData.amount),
        total_amount: parseInt(editFormData.amount)
      };
      
      await api.updateCost(editingCost.id, updateData);
      alert('更新しました');
      fetchCosts();
      setEditingCost(null);
    } catch (error) {
      console.error('Error updating cost:', error);
      alert('更新に失敗しました');
    }
  };

  // 削除
  const handleDelete = async (id) => {
    if (!confirm('この原価データを削除してもよろしいですか？')) return;
    
    try {
      await api.deleteCost(id);
      alert('削除しました');
      fetchCosts();
    } catch (error) {
      console.error('Error deleting cost:', error);
      alert('削除に失敗しました');
    }
  };

  // ソート機能
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 一覧から選択肢を生成
  const uniqueDates = [...new Set(costs.map(c => c.date.split('T')[0]))].sort();
  const uniqueVendors = [...new Set(costs.map(c => c.vendor))].sort();
  const uniqueCategories = [...new Set(costs.map(c => c.category))].sort();

  // フィルターとソートを適用
  let filteredCosts = [...costs];

  // フィルター適用
  if (headerFilters.date) {
    filteredCosts = filteredCosts.filter(cost => 
      cost.date.split('T')[0] === headerFilters.date
    );
  }
  if (headerFilters.project_id) {
    filteredCosts = filteredCosts.filter(cost => 
      cost.project_id === parseInt(headerFilters.project_id)
    );
  }
  if (headerFilters.vendor) {
    filteredCosts = filteredCosts.filter(cost => 
      cost.vendor === headerFilters.vendor
    );
  }
  if (headerFilters.category) {
    filteredCosts = filteredCosts.filter(cost => 
      cost.category === headerFilters.category
    );
  }

  // ソート適用
  if (sortConfig.key) {
    filteredCosts.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // 合計金額
  const totalAmount = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);

  // フィルターリセット
  const handleResetFilters = () => {
    setHeaderFilters({
      date: '',
      project_id: '',
      vendor: '',
      category: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* 原価一覧テーブル */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              原価一覧
              <span className="text-sm text-gray-500 ml-2">
                （ヘッダーのフィルターで絞り込み、クリックでソート）
              </span>
            </h2>
            <div className="flex items-center gap-4">
              {(headerFilters.date || headerFilters.project_id || headerFilters.vendor || headerFilters.category) && (
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  フィルターをクリア
                </button>
              )}
              <div className="text-lg font-bold">
                合計: ¥{totalAmount.toLocaleString()}
                {filteredCosts.length < costs.length && (
                  <span className="text-sm text-gray-500 ml-2">
                    （{filteredCosts.length}/{costs.length}件）
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-4 text-gray-500">読み込み中...</p>
          ) : costs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div 
                          onClick={() => handleSort('date')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded inline-block"
                        >
                          日付 {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </div>
                        <select
                          value={headerFilters.date}
                          onChange={(e) => setHeaderFilters({...headerFilters, date: e.target.value})}
                          className="mt-1 w-full px-2 py-1 text-xs border rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">全て</option>
                          {uniqueDates.map(date => (
                            <option key={date} value={date}>
                              {new Date(date + 'T00:00:00').toLocaleDateString('ja-JP')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div className="px-2 py-1">工事</div>
                        <select
                          value={headerFilters.project_id}
                          onChange={(e) => setHeaderFilters({...headerFilters, project_id: e.target.value})}
                          className="mt-1 w-full px-2 py-1 text-xs border rounded"
                        >
                          <option value="">全て</option>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.project_code} - {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div 
                          onClick={() => handleSort('vendor')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded inline-block"
                        >
                          業者名 {sortConfig.key === 'vendor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </div>
                        <select
                          value={headerFilters.vendor}
                          onChange={(e) => setHeaderFilters({...headerFilters, vendor: e.target.value})}
                          className="mt-1 w-full px-2 py-1 text-xs border rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">全て</option>
                          {uniqueVendors.map(vendor => (
                            <option key={vendor} value={vendor}>{vendor}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      内容
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>
                        <div
                          onClick={() => handleSort('category')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded inline-block"
                        >
                          カテゴリ {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </div>
                        <select
                          value={headerFilters.category}
                          onChange={(e) => setHeaderFilters({...headerFilters, category: e.target.value})}
                          className="mt-1 w-full px-2 py-1 text-xs border rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">全て</option>
                          {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('amount')}
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      金額 {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCosts.map((cost) => {
                    const project = projects.find(p => p.id === cost.project_id);
                    return (
                      <tr key={cost.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(cost.date).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {project ? `${project.project_code} - ${project.name}` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {cost.vendor}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {cost.description || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(cost.category)}`}>
                            {cost.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          ¥{cost.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleEdit(cost)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(cost.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              原価データがありません
            </p>
          )}
        </div>
      </div>

      {/* 編集モーダル（変更なし） */}
      {editingCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">原価編集</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事</label>
                  <select
                    value={editFormData.project_id}
                    onChange={(e) => setEditFormData({...editFormData, project_id: parseInt(e.target.value)})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.project_code} - {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">業者名</label>
                  <input
                    type="text"
                    value={editFormData.vendor}
                    onChange={(e) => setEditFormData({...editFormData, vendor: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                  <input
                    type="number"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditingCost(null)}
                  className="bg-gray-500 text-white rounded px-4 py-2 hover:bg-gray-600"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CostList;