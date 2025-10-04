import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, Building, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../api/client';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [periodType, setPeriodType] = useState('current');
  const [loading, setLoading] = useState(true);
  const [fiscalSettings, setFiscalSettings] = useState(null);
  const [showUnbilledDetails, setShowUnbilledDetails] = useState(false);
  const [showUnpaidDetails, setShowUnpaidDetails] = useState(false);

  useEffect(() => {
    fetchFiscalSettings();
  }, []);

  useEffect(() => {
    if (fiscalSettings) {
      fetchDashboardData();
    }
  }, [periodType, fiscalSettings]);

  const fetchFiscalSettings = async () => {
    try {
      const settings = await api.getSettings();
      const startMonth = settings.data.find(s => s.key === 'fiscal_year_start_month');
      const currentPeriod = settings.data.find(s => s.key === 'current_fiscal_period');
      
      setFiscalSettings({
        startMonth: startMonth?.value || '8',
        currentPeriod: currentPeriod?.value || '1'
      });
    } catch (error) {
      console.error('Error fetching fiscal settings:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.getDashboardSummary({
        period_type: periodType,
        view_scope: 'my'  // 常に自分のデータのみ
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getProfitRateColor = (rate) => {
    if (rate >= 30) return 'text-green-600';
    if (rate >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPeriodOptions = () => {
    if (!fiscalSettings) return [];
    const period = parseInt(fiscalSettings.currentPeriod);
    
    return [
      { value: 'current', label: `今期（第${period}期）` },
      { value: 'previous', label: `前期（第${period - 1}期）` },
      { value: 'all', label: '全期間' },
    ];
  };

  if (loading || !fiscalSettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 期間選択 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">表示期間</span>
          </div>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {getPeriodOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {summary && (
          <div className="mt-2 text-sm text-gray-600">
            期間: {new Date(summary.period_info.start_date).toLocaleDateString('ja-JP')} 
            〜 {new Date(summary.period_info.end_date).toLocaleDateString('ja-JP')}
          </div>
        )}
      </div>

      {/* サマリーカード */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 受注額 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">受注額</h3>
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.summary.total_contract)}
              </p>
            </div>

            {/* 原価合計 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">原価合計</h3>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.summary.total_cost)}
              </p>
            </div>

            {/* 粗利益 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">粗利益</h3>
                <TrendingUp className={`w-5 h-5 ${summary.summary.gross_profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <p className={`text-2xl font-bold ${summary.summary.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.summary.gross_profit)}
              </p>
            </div>

            {/* 粗利率 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">粗利率</h3>
                <Percent className="w-5 h-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold ${getProfitRateColor(summary.summary.gross_profit_rate)}`}>
                {summary.summary.gross_profit_rate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* プロジェクト状況 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                プロジェクト状況
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">進行中</span>
                  <span className="font-bold text-green-600">{summary.projects.active}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">完了</span>
                  <span className="font-bold text-gray-700">{summary.projects.completed}件</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-700 font-medium">合計</span>
                  <span className="font-bold text-lg">{summary.projects.total}件</span>
                </div>
              </div>
            </div>

            {/* カテゴリ別原価 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 カテゴリ別原価
              </h3>
              <div className="space-y-3">
                {Object.entries(summary.cost_breakdown).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-gray-600">{category}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
                {Object.keys(summary.cost_breakdown).length === 0 && (
                  <p className="text-gray-500 text-sm">データがありません</p>
                )}
              </div>
            </div>
          </div>

          {/* 未請求・未入金状況（改善版） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 未請求 */}
            <div className="bg-white rounded-lg shadow">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowUnbilledDetails(!showUnbilledDetails)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      未請求
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">件数</span>
                        <span className="font-bold text-orange-600 text-lg">
                          {summary.unbilled?.count || 0}件
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">金額合計</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(summary.unbilled?.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    {showUnbilledDetails ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </div>
              
              {/* 未請求詳細 */}
              {showUnbilledDetails && summary.unbilled?.projects && summary.unbilled.projects.length > 0 && (
                <div className="border-t px-6 pb-6">
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium text-gray-600 mb-2">該当工事</div>
                    {summary.unbilled.projects.map((project) => (
                      <div key={project.id} className="bg-orange-50 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-800">
                              {project.project_code} - {project.name}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              顧客: {project.client_name || '-'}
                              {project.end_date && (
                                <span className="ml-2">
                                  終了予定: {new Date(project.end_date).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-orange-600 font-medium">
                            {formatCurrency(project.contract_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 未入金 */}
            <div className="bg-white rounded-lg shadow">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowUnpaidDetails(!showUnpaidDetails)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      未入金
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">件数</span>
                        <span className="font-bold text-red-600 text-lg">
                          {summary.unpaid?.count || 0}件
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">金額合計</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(summary.unpaid?.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    {showUnpaidDetails ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </div>
              
              {/* 未入金詳細 */}
              {showUnpaidDetails && summary.unpaid?.projects && summary.unpaid.projects.length > 0 && (
                <div className="border-t px-6 pb-6">
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium text-gray-600 mb-2">該当工事</div>
                    {summary.unpaid.projects.map((project) => (
                      <div key={project.id} className="bg-red-50 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-800">
                              {project.project_code} - {project.name}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              顧客: {project.client_name || '-'}
                              {project.invoice_date && (
                                <span className="ml-2">
                                  請求日: {new Date(project.invoice_date).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-red-600 font-medium">
                            {formatCurrency(project.contract_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;