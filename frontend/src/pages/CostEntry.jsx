import { useState, useEffect } from 'react';
import api from '../api/client';
import CostForm from '../components/CostForm';

function CostEntry() {
  const [categories, setCategories] = useState([]);
  const [todayCosts, setTodayCosts] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchTodayCosts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTodayCosts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.getCosts({ date: today });
      setTodayCosts(response.data);
    } catch (error) {
      console.error('Error fetching costs:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 入力フォーム */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">原価入力</h2>
        <CostForm 
          categories={categories} 
          onSuccess={fetchTodayCosts}
        />
      </div>

      {/* カテゴリ一覧 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">利用可能なカテゴリ</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.id}
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: category.color + '20',
                color: category.color
              }}
            >
              {category.name}
            </span>
          ))}
        </div>
      </div>

      {/* 今日の入力履歴 */}
      {todayCosts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">今日入力した原価</h3>
          <div className="space-y-2">
            {todayCosts.map((cost) => (
              <div key={cost.id} className="border-b pb-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{cost.vendor}</span>
                  <span className="font-medium">¥{cost.amount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">{cost.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CostEntry;