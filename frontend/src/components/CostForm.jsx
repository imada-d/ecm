import { useState, useEffect } from 'react';
import api from '../api/client';

function CostForm({ categories, onSuccess }) {
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    amount: '',
    category: '材料費',
    tax_type: 'included'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.getProjects();
      setProjects(response.data.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

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
        total_amount: parseInt(formData.amount)
      };
      
      await api.createCost(submitData);
      alert('原価を登録しました！');
      
      // フォームリセット
      setFormData({
        ...formData,
        vendor: '',
        description: '',
        amount: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating cost:', error);
      alert('エラーが発生しました');
    }
  };

  return (
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

        {/* 業者名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            業者名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.vendor}
            onChange={(e) => setFormData({...formData, vendor: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="例: 〇〇電気"
            required
          />
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

        {/* カテゴリ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
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
  );
}

export default CostForm;