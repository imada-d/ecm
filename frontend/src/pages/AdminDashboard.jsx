import { useState, useEffect } from 'react';
import api from '../api/client';
import { StatsCard, ProjectListCard, UserStatsCard } from '../components/DashboardCards';
import Dashboard from './Dashboard';

function AdminDashboard() {
  const [allStats, setAllStats] = useState({});
  const [myStats, setMyStats] = useState({});
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('admin'); // 'my' or 'admin'

    // アコーディオンの開閉状態
  const [openSections, setOpenSections] = useState({
    allStats: true,      // 全体統計：デフォルトで開く
    myStats: true,       // 自分の統計：デフォルトで開く
    details: false,      // 詳細情報：デフォルトで閉じる
    userStats: false     // ユーザー別実績：デフォルトで閉じる
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

    const fetchDashboardData = async () => {
        try {
        // 全体統計を取得
        const allResponse = await api.getDashboardAll();
        setAllStats(allResponse.data);

        // 自分の統計を取得
        const myResponse = await api.getDashboardMy();
        setMyStats(myResponse.data);

        // ユーザー別統計を取得
        const userResponse = await api.getDashboardUsers();
        setUserStats(userResponse.data);

        } catch (error) {
        console.error('Error fetching dashboard data:', error);
        } finally {
        setLoading(false);
        }
    };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

return (
    <div className="space-y-4">
      {/* タブ切り替え */}
      <div className="bg-white rounded-lg shadow p-2 flex gap-2">
        <button
          onClick={() => setViewMode('my')}
          className={`flex-1 px-4 py-2 rounded transition-colors ${
            viewMode === 'my' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          自分の統計
        </button>
        <button
          onClick={() => setViewMode('admin')}
          className={`flex-1 px-4 py-2 rounded transition-colors ${
            viewMode === 'admin' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          管理者統計
        </button>
      </div>

      {/* 自分の統計を表示 */}
      {viewMode === 'my' && <Dashboard />}

      {/* 管理者統計を表示 */}
      {viewMode === 'admin' && (
        <>
      {/* 全体統計 */}
      <div className="border rounded-lg overflow-hidden bg-white shadow">
        <button
          onClick={() => toggleSection('allStats')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>{openSections.allStats ? '▼' : '▶'}</span>
            📊 全体統計
          </h2>
        </button>
        {openSections.allStats && (
          <div className="p-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard 
                title="全体受注額" 
                amount={allStats.total_amount || 0}
                color="blue"
              />
              <StatsCard 
                title="全体原価" 
                amount={allStats.total_cost || 0}
                color="red"
              />
              <StatsCard 
                title="全体粗利益" 
                amount={allStats.gross_profit || 0}
                color="green"
              />
              <StatsCard 
                title="全体粗利率" 
                amount={`${allStats.profit_rate?.toFixed(1) || 0}%`}
                color={allStats.profit_rate >= 30 ? 'green' : allStats.profit_rate >= 20 ? 'yellow' : 'red'}
              />
            </div>
          </div>
        )}
      </div>

      {/* 自分の統計 */}
      <div className="border rounded-lg overflow-hidden bg-white shadow">
        <button
          onClick={() => toggleSection('myStats')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>{openSections.myStats ? '▼' : '▶'}</span>
            👤 {user.name}さんの統計
          </h2>
        </button>
        {openSections.myStats && (
          <div className="p-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard 
                title="自分の受注額" 
                amount={myStats.total_amount || 0}
                color="blue"
              />
              <StatsCard 
                title="自分の原価" 
                amount={myStats.total_cost || 0}
                color="red"
              />
              <StatsCard 
                title="自分の粗利益" 
                amount={myStats.gross_profit || 0}
                color="green"
              />
              <StatsCard 
                title="自分の粗利率" 
                amount={`${myStats.profit_rate?.toFixed(1) || 0}%`}
                color={myStats.profit_rate >= 30 ? 'green' : myStats.profit_rate >= 20 ? 'yellow' : 'red'}
              />
            </div>
          </div>
        )}
      </div>

      {/* 詳細情報 */}
      <div className="border rounded-lg overflow-hidden bg-white shadow">
        <button
          onClick={() => toggleSection('details')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>{openSections.details ? '▼' : '▶'}</span>
            🏗️ 詳細情報
          </h2>
        </button>
        {openSections.details && (
          <div className="p-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProjectListCard 
                title="🏗️ 全体の進行中工事"
                projects={allStats.active_projects || []}
              />
              <ProjectListCard 
                title="📋 自分の進行中工事"
                projects={myStats.active_projects || []}
              />
            </div>
          </div>
        )}
      </div>

      {/* ユーザー別実績 */}
      <div className="border rounded-lg overflow-hidden bg-white shadow">
        <button
          onClick={() => toggleSection('userStats')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>{openSections.userStats ? '▼' : '▶'}</span>
            👥 ユーザー別実績
          </h2>
        </button>
        {openSections.userStats && (
          <div className="p-6 border-t">
            <UserStatsCard userStats={userStats || []} />
          </div>
        )}
        </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;