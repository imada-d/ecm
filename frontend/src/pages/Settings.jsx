import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Calendar } from 'lucide-react';
import api from '../api/client';

function Settings() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });
  const [editingId, setEditingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState({});
  
  // 期の設定
  const [fiscalSettings, setFiscalSettings] = useState({
    fiscal_start_year: 2000,   // 開始年
    fiscal_start_month: 8,      // 8月開始をデフォルトに（コメント修正）
    staff_code_digits: 3,       // 担当者番号の桁数
    current_period: 26          // 現在の期（2000年8月開始なら今は26期）
  });

   const [unbilledSetting, setUnbilledSetting] = useState('completed');

  // 色の選択肢
  const colorOptions = [
    { value: '#3B82F6', label: '青', class: 'bg-blue-500' },
    { value: '#EF4444', label: '赤', class: 'bg-red-500' },
    { value: '#10B981', label: '緑', class: 'bg-green-500' },
    { value: '#F59E0B', label: '黄', class: 'bg-yellow-500' },
    { value: '#8B5CF6', label: '紫', class: 'bg-purple-500' },
    { value: '#EC4899', label: 'ピンク', class: 'bg-pink-500' },
    { value: '#6B7280', label: '灰', class: 'bg-gray-500' },
  ];

  // 月の選択肢
  const monthOptions = [
    { value: '1', label: '1月' },
    { value: '2', label: '2月' },
    { value: '3', label: '3月' },
    { value: '4', label: '4月' },
    { value: '5', label: '5月' },
    { value: '6', label: '6月' },
    { value: '7', label: '7月' },
    { value: '8', label: '8月' },
    { value: '9', label: '9月' },
    { value: '10', label: '10月' },
    { value: '11', label: '11月' },
    { value: '12', label: '12月' },
  ];

  useEffect(() => {
    fetchCategories();
    fetchFiscalSettings();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // 期の設定を取得
  const fetchFiscalSettings = async () => {
    try {
      const response = await api.getFiscalSettings();
      setFiscalSettings(response.data);
      
      // 未請求設定は別途取得（既存のまま）
      const settings = await api.getSettings();
      const unbilled = settings.data.find(s => s.key === 'unbilled_definition');
      setUnbilledSetting(unbilled?.value || 'completed');
    } catch (error) {
      console.error('Error fetching fiscal settings:', error);
      // 権限エラーの場合は何もしない（初期読み込み時はエラー表示しない）
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        // それ以外のエラーの場合のみログ出力（アラートは出さない）
        console.log('設定の読み込みをスキップしました');
      }
    }
  };

  // 期の設定を保存
    const saveFiscalSettings = async () => {
      try {
        await api.updateFiscalSettings({
          fiscal_start_year: fiscalSettings.fiscal_start_year,
          fiscal_start_month: fiscalSettings.fiscal_start_month,
          staff_code_digits: fiscalSettings.staff_code_digits
        });
        
        // 更新後のデータを取得（現在の期が再計算される）
        const response = await api.getFiscalSettings();
        setFiscalSettings(response.data);
        
        alert('決算期設定を保存しました');
      } catch (error) {
        console.error('Error saving fiscal settings:', error);
        if (error.response?.status === 403) {
          alert('権限がありません。管理者にお問い合わせください。');
        } else {
          alert('設定の保存に失敗しました');
        }
      }
    };



  // カテゴリ追加
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      alert('カテゴリ名を入力してください');
      return;
    }

    try {
      await api.createCategory({
        ...newCategory,
        display_order: categories.length + 1,
        is_default: false,
        is_active: true
      });
      alert('カテゴリを追加しました');
      setNewCategory({ name: '', color: '#3B82F6' });
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('追加に失敗しました');
    }
  };

  // 編集開始
  const startEdit = (category) => {
    setEditingId(category.id);
    setEditingCategory({ ...category });
  };

  // 編集保存
  const saveEdit = async () => {
    try {
      await api.updateCategory(editingId, editingCategory);
      alert('更新しました');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('更新に失敗しました');
    }
  };

  // 削除
  const handleDelete = async (id, name) => {
    const category = categories.find(c => c.id === id);
    if (category?.is_default) {
      alert('デフォルトカテゴリは削除できません');
      return;
    }

    if (!confirm(`「${name}」を削除してもよろしいですか？`)) return;

    try {
      await api.deleteCategory(id);
      alert('削除しました');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* タイトル */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800">⚙️ 設定</h2>
        <p className="text-sm text-gray-600 mt-1">システムの各種設定を管理します</p>
      </div>

      {/* 決算期設定 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          決算期設定
        </h3>
        
        {/* 説明文 */}
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded">
          <p>期の管理設定を行います。現在は第{fiscalSettings.current_period}期です。</p>
          <p className="mt-1">工事番号は[期][担当者番号]-[工事番号]で構成されます。</p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期の開始年
              </label>
              <input
                type="number"
                value={fiscalSettings.fiscal_start_year}
                onChange={(e) => setFiscalSettings({
                  ...fiscalSettings, 
                  fiscal_start_year: parseInt(e.target.value)
                })}
                className="w-full border rounded px-3 py-2"
                placeholder="2000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期の開始月
              </label>
              <select
                value={fiscalSettings.fiscal_start_month}
                onChange={(e) => setFiscalSettings({
                  ...fiscalSettings, 
                  fiscal_start_month: parseInt(e.target.value)
                })}
                className="w-full border rounded px-3 py-2"
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}開始
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                担当者番号の桁数
              </label>
              <input
                type="number"
                value={fiscalSettings.staff_code_digits}
                onChange={(e) => setFiscalSettings({
                  ...fiscalSettings, 
                  staff_code_digits: parseInt(e.target.value)
                })}
                className="w-full border rounded px-3 py-2"
                min="1"
                max="5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-lg">
                現在: 第{fiscalSettings.current_period}期
              </span>
              <span className="ml-2 text-gray-500">
                （{fiscalSettings.fiscal_start_year}年{fiscalSettings.fiscal_start_month}月から起算）
              </span>
            </div>
            <button
              onClick={saveFiscalSettings}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* 未請求の定義設定 */}
    <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        未請求の定義設定
    </h3>
    
    <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded">
        <p>ダッシュボードで「未請求」として表示する条件を設定します。</p>
    </div>
    
    <div className="space-y-3">
        <label className="flex items-center gap-2">
        <input
            type="radio"
            value="active"
            checked={unbilledSetting === 'active'}
            onChange={(e) => setUnbilledSetting(e.target.value)}
            className="text-blue-600"
        />
        <span>ステータスが「進行中」で請求日が未入力</span>
        </label>
        
        <label className="flex items-center gap-2">
        <input
            type="radio"
            value="completed"
            checked={unbilledSetting === 'completed'}
            onChange={(e) => setUnbilledSetting(e.target.value)}
            className="text-blue-600"
        />
        <span>ステータスが「完了」で請求日が未入力</span>
        </label>
        
        <label className="flex items-center gap-2">
        <input
            type="radio"
            value="overdue"
            checked={unbilledSetting === 'overdue'}
            onChange={(e) => setUnbilledSetting(e.target.value)}
            className="text-blue-600"
        />
        <span>終了予定日を過ぎて請求日が未入力</span>
        </label>
    </div>
    
    <div className="mt-4 flex justify-end">
        <button
          onClick={async () => {
              try {
                await api.updateSetting('unbilled_definition', { value: unbilledSetting });
                alert('未請求設定を保存しました');
              } catch (error) {
                console.error('Error saving unbilled setting:', error);
                if (error.response?.status === 403) {
                  alert('権限がありません。管理者にお問い合わせください。');
                } else {
                  alert('設定の保存に失敗しました');
                }
              }
          }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
        保存
        </button>
    </div>
    </div>

      {/* カテゴリ管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📁 カテゴリ管理</h3>
        
        {/* 新規追加フォーム */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              className="flex-1 border rounded px-3 py-2"
              placeholder="新しいカテゴリ名"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <select
              value={newCategory.color}
              onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
              className="border rounded px-3 py-2"
            >
              {colorOptions.map(color => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCategory}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              追加
            </button>
          </div>
        </div>

        {/* カテゴリ一覧 */}
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              {editingId === category.id ? (
                // 編集モード
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                      className="border rounded px-2 py-1"
                    />
                    <select
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})}
                      className="border rounded px-2 py-1"
                    >
                      {colorOptions.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={saveEdit}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                // 表示モード
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    {category.is_default && (
                      <span className="text-xs text-gray-500">（デフォルト）</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!category.is_default && (
                      <>
                        <button
                          onClick={() => startEdit(category)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 今後の拡張用 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔧 その他の設定</h3>
        <p className="text-gray-500">未実装</p>
      </div>
    </div>
  );
}

export default Settings;