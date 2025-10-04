import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import api from '../api/client';

function CostManagement() {
  // ステート管理
  const [showForm, setShowForm] = useState(true);
  const [costs, setCosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // 入力フォーム
  const [formData, setFormData] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    amount: '',
    category: '',
    tax_type: 'included'
  });

  // フィルター
  const [headerFilters, setHeaderFilters] = useState({
    date: '',
    project_id: '',
    vendor: '',
    category: ''
  });

  // カテゴリごとの色
  const categoryColors = {
    '材料費': 'bg-blue-100 text-blue-800',
    '外注費': 'bg-red-100 text-red-800',
    '経費': 'bg-green-100 text-green-800',
    'その他': 'bg-gray-100 text-gray-800',
    'default': 'bg-purple-100 text-purple-800'
  };

  // 初期データ取得
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [costsRes, projectsRes, vendorsRes, categoriesRes] = await Promise.all([
        api.getCosts(),
        api.getProjects(),
        api.getVendors(),
        api.getCategories()
      ]);
      setCosts(costsRes.data);
      setProjects(projectsRes.data.filter(p => p.status === 'active'));
      setVendors(vendorsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 原価登録
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.vendor || !formData.amount) {
      alert('プロジェクト、業者名、金額は必須です');
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parseInt(formData.amount),
        total_amount: parseInt(formData.amount),
        category: formData.category || '材料費'
      };
      
      await api.createCost(submitData);
      alert('原価を登録しました！');
      
      // フォームの一部リセット
      setFormData({
        ...formData,
        vendor: '',
        description: '',
        amount: ''
      });
      
      fetchInitialData();
    } catch (error) {
      console.error('Error creating cost:', error);
      alert('エラーが発生しました');
    }
  };

  // 編集保存
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editingCost,
        amount: parseInt(editingCost.amount),
        total_amount: parseInt(editingCost.amount)
      };
      
      await api.updateCost(editingCost.id, updateData);
      alert('更新しました');
      fetchInitialData();
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
      fetchInitialData();
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

  // フィルターとソート適用
  let filteredCosts = [...costs];
  
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

  const totalAmount = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const uniqueDates = [...new Set(costs.map(c => c.date.split('T')[0]))].sort();
  const uniqueVendors = [...new Set(costs.map(c => c.vendor))].sort();
  const uniqueCategories = [...new Set(costs.map(c => c.category))].sort();

  const getCategoryColor = (category) => categoryColors[category] || categoryColors['default'];

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 原価入力フォーム（折りたたみ可能） */}
      <div className="bg-white rounded-lg shadow">
        <div 
          onClick={() => setShowForm(!showForm)}
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold text-gray-800">
            📝 原価入力
          </h2>
          {showForm ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {showForm && (
          <div className="p-6 border-t">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 日付 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日付
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                {/* プロジェクト選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工事選択 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">選択してください</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.project_code} - {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* カテゴリ（クイックボタン版） */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ
                </label>
                
                {/* カテゴリクイックボタン */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {categories.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat.name})}
                        className={`text-xs px-6 py-6 rounded transition-colors ${
                        formData.category === cat.name 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {cat.name}
                    </button>
                    ))}
                    {formData.category && (
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, category: ''})}
                        className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                    >
                        ✕ クリア
                    </button>
                    )}
                </div>
                </div>

                {/* 業者選択（クイックボタン＋手入力） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    業者名 <span className="text-red-500">*</span>
                  </label>
                  
                  {/* よく使う業者のクイックボタン */}
                  {vendors.filter(v => v.is_favorite).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-gray-500 mr-1"></span>
                      {vendors.filter(v => v.is_favorite).map(vendor => (
                        <button
                          key={vendor.id}
                          type="button"
                          onClick={() => setFormData({...formData, vendor: vendor.name})}
                          className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
                        >
                          {vendor.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* カテゴリの業者のクイックボタン */}
                  {formData.category && vendors.filter(v => v.category === formData.category && !v.is_favorite).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-gray-500 mr-1">{formData.category}:</span>
                      {vendors
                        .filter(v => v.category === formData.category && !v.is_favorite)
                        .slice(0, 5)  // 最初の5件だけ表示
                        .map(vendor => (
                          <button
                            key={vendor.id}
                            type="button"
                            onClick={() => setFormData({...formData, vendor: vendor.name})}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            {vendor.name}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  {/* 入力欄とクリアボタン */}
                <div className="relative">
                <input
                    type="text"
                    list="vendor-list"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                    className="w-full border rounded px-3 py-2 pr-8"
                    placeholder="業者名を入力または選択"
                    required
                />
                {formData.vendor && (
                    <button
                    type="button"
                    onClick={() => setFormData({...formData, vendor: ''})}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                    ✕
                    </button>
                )}
                </div>
                  <datalist id="vendor-list">
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.name} />
                    ))}
                  </datalist>
                </div>

                {/* 金額 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例: 10000"
                    required
                  />
                </div>

                {/* 消費税 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    消費税
                  </label>
                  <select
                    value={formData.tax_type}
                    onChange={(e) => setFormData({...formData, tax_type: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="included">税込</option>
                    <option value="excluded">税別</option>
                  </select>
                </div>

                {/* 内容/摘要 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    内容/摘要
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                    placeholder="例: ケーブル購入、〇〇工事材料"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white rounded px-6 py-2 hover:bg-blue-600"
                >
                  登録
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 原価一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📊 原価一覧
            </h2>
            <div className="text-lg font-bold">
              合計: ¥{totalAmount.toLocaleString()}
              {filteredCosts.length < costs.length && (
                <span className="text-sm text-gray-500 ml-2">
                  （{filteredCosts.length}/{costs.length}件）
                </span>
              )}
            </div>
          </div>

          {/* テーブル */}
          {costs.length > 0 ? (
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
                            onClick={() => setEditingCost(cost)}
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

      {/* 編集モーダル（簡略化） */}
      {editingCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">原価編集</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={editingCost.date?.split('T')[0]}
                    onChange={(e) => setEditingCost({...editingCost, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">業者名</label>
                  <input
                    type="text"
                    value={editingCost.vendor}
                    onChange={(e) => setEditingCost({...editingCost, vendor: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                  <input
                    type="number"
                    value={editingCost.amount}
                    onChange={(e) => setEditingCost({...editingCost, amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={editingCost.category}
                    onChange={(e) => setEditingCost({...editingCost, category: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                  <textarea
                    value={editingCost.description || ''}
                    onChange={(e) => setEditingCost({...editingCost, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingCost(null)}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-500 text-white rounded px-4 py-2"
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

export default CostManagement;