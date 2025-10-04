import { useState, useEffect } from 'react';
import api from '../api/client';

function ProjectForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    project_code: '',
    name: '',
    client_name: '',
    estimate_number: '',  // 追加
    contract_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''  // 追加
  });

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_code || !formData.name) {
      alert('工事番号と工事名は必須です');
      return;
    }

    try {
      const submitData = {
        ...formData,
        contract_amount: formData.contract_amount ? parseInt(formData.contract_amount) : 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: 'active'  // 常にactiveで登録
      };
      
      const response = await api.createProject(submitData);
      if (response.status === 200 || response.status === 201) {
        setFormData({
          project_code: '',
          name: '',
          client_name: '',
          estimate_number: '',
          contract_amount: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          notes: ''
        });
        alert('プロジェクトを追加しました！');
        if (onSuccess) onSuccess();
      }
      } catch (error) {
      console.error('Error creating project:', error);
      // バックエンドからのエラーメッセージを取得
      const errorMessage = error.response?.data?.detail || 'エラーが発生しました';
      alert(errorMessage);
    }
  };

  return (
    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">新規工事登録</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 工事番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工事番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例: 8-1"
              value={formData.project_code}
              onChange={(e) => setFormData({...formData, project_code: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* 工事名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工事名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例: 〇〇工事"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* 顧客名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              顧客名
            </label>
            <input
              type="text"
              list="customer-list"
              placeholder="選択または入力"
              value={formData.client_name}
              onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
            <datalist id="customer-list">
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
              placeholder=" "
              value={formData.estimate_number}
              onChange={(e) => setFormData({...formData, estimate_number: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* 受注金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              受注金額（円）
            </label>
            <input
              type="number"
              placeholder="例: 1500000"
              value={formData.contract_amount}
              onChange={(e) => setFormData({...formData, contract_amount: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* 開始日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* 終了予定日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了予定日
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* メモ（追加） - 2列分使用 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <textarea
              placeholder="工事に関するメモ・備考など"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border rounded px-3 py-2"
              rows="3"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 text-white rounded px-6 py-2 hover:bg-blue-600"
          >
            登録
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;