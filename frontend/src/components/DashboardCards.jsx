import React from 'react';

// 統計カード
export const StatsCard = ({ title, amount, subtext, color = 'blue' }) => {
  const colorClass = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600'
  }[color];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {typeof amount === 'number' ? `¥${amount.toLocaleString()}` : amount}
      </div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
};

// プロジェクトリストカード
export const ProjectListCard = ({ projects, title }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {projects && projects.length > 0 ? (
        <div className="space-y-2">
          {projects.slice(0, 5).map(project => (
            <div key={project.id} className="flex justify-between text-sm">
              <span>{project.project_code} - {project.name}</span>
              <span className="text-gray-600">¥{project.contract_amount?.toLocaleString()}</span>
            </div>
          ))}
          {projects.length > 5 && (
            <div className="text-xs text-gray-500 text-center mt-2">
              他 {projects.length - 5} 件
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">データがありません</p>
      )}
    </div>
  );
};

// ユーザー別実績カード（管理者用）
export const UserStatsCard = ({ userStats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">ユーザー別実績</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">担当者</th>
            <th className="text-right py-2">工事数</th>
            <th className="text-right py-2">受注額</th>
            <th className="text-right py-2">粗利率</th>
          </tr>
        </thead>
        <tbody>
          {userStats && userStats.map(stat => (
            <tr key={stat.user_id} className="border-b">
              <td className="py-2">{stat.user_name}</td>
              <td className="text-right py-2">{stat.project_count}</td>
              <td className="text-right py-2">¥{stat.total_amount?.toLocaleString()}</td>
              <td className="text-right py-2">
                <span className={`font-bold ${
                  stat.profit_rate >= 30 ? 'text-green-600' :
                  stat.profit_rate >= 20 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stat.profit_rate?.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};