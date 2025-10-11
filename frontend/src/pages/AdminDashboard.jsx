import { useState, useEffect } from 'react';
import api from '../api/client';
import { StatsCard, ProjectListCard, UserStatsCard } from '../components/DashboardCards';

function AdminDashboard() {
  const [allStats, setAllStats] = useState({});
  const [myStats, setMyStats] = useState({});
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 全体統計 */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">📊 全体統計</h2>
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

      {/* 自分の統計 */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">👤 {user.name}さんの統計</h2>
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

      {/* 詳細情報 */}
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

      {/* ユーザー別実績 */}
      <UserStatsCard userStats={userStats || []} />
    </div>
  );
}

export default AdminDashboard;