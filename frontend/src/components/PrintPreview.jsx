import { useState, useEffect } from 'react';
import api from '../api/client';

function PrintPreview({ filterOptions, onClose }) {
  const [projects, setProjects] = useState([]);
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 帳票テンプレート設定を取得
      const templateRes = await api.getPrintTemplate();
      const templateData = templateRes.data;
      const config = JSON.parse(templateData.config);
      setTemplate(config);

      // 工事データを取得
      const projectsRes = await api.getProjects();
      let filteredProjects = projectsRes.data;

      // フィルタリング
      // 1. 工事番号プレフィックスでフィルタ
      filteredProjects = filteredProjects.filter(project => {
        const match = project.project_code.match(/^(\d+)-/);
        return match && match[1] === filterOptions.prefix;
      });

      // 2. ユーザーでフィルタ
      if (filterOptions.userId !== 'all') {
        filteredProjects = filteredProjects.filter(
          project => project.user_id === parseInt(filterOptions.userId)
        );
      }

      // 3. 全体経費の除外
      if (!filterOptions.includeGeneralExpense) {
        filteredProjects = filteredProjects.filter(
          project => project.status !== 'general_expense'
        );
      }

      setProjects(filteredProjects);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // 工事番号から工事番号部分のみを抽出（ハイフンの後）
  const extractProjectNumber = (projectCode) => {
    const match = projectCode.match(/-(.+)$/);
    return match ? match[1] : projectCode;
  };

  // 収入金額を計算（入金済みなら受注金額、未入金なら空欄）
  const getPaidAmount = (project) => {
    return project.payment_date ? project.contract_amount : null;
  };

  // 合計金額を計算
  const calculateTotals = () => {
    const totalContract = projects.reduce((sum, p) => sum + (p.contract_amount || 0), 0);
    const totalPaid = projects.reduce((sum, p) => sum + (getPaidAmount(p) || 0), 0);
    return { totalContract, totalPaid };
  };

  const totals = calculateTotals();

  if (isLoading || !template) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* 印刷用のスタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 20mm; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
        @page { size: A4 portrait; margin: 20mm; }
      `}</style>

      {/* 印刷ボタン（印刷時は非表示） */}
      <div className="no-print sticky top-0 bg-white border-b p-4 flex gap-2 justify-end">
        <button
          onClick={handlePrint}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          印刷
        </button>
        <button
          onClick={onClose}
          className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
        >
          閉じる
        </button>
      </div>

      {/* 印刷内容 */}
      <div className="max-w-[210mm] mx-auto p-8">
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              {template.columns.map((col, index) => (
                col.enabled && (
                  <th key={index} className="border border-gray-400 px-2 py-1 text-sm">
                    {col.label}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                {template.columns.map((col, index) => {
                  if (!col.enabled) return null;
                  
                  let value = '';
                  if (col.field === 'project_code') {
                    value = extractProjectNumber(project.project_code);
                  } else if (col.field === 'paid_amount') {
                    const paid = getPaidAmount(project);
                    value = paid ? `¥${paid.toLocaleString()}` : '';
                  } else if (col.field === 'contract_amount') {
                    value = project.contract_amount ? `¥${project.contract_amount.toLocaleString()}` : '';
                  } else {
                    value = project[col.field] || '';
                  }

                  return (
                    <td key={index} className="border border-gray-400 px-2 py-1 text-sm">
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* 合計行 */}
            {template.showTotal && (
              <tr className="font-bold bg-gray-50">
                {template.columns.map((col, index) => {
                  if (!col.enabled) return null;
                  
                  let value = '';
                  if (col.field === 'project_code') {
                    value = '計';
                  } else if (col.field === 'contract_amount') {
                    value = `¥${totals.totalContract.toLocaleString()}`;
                  } else if (col.field === 'paid_amount') {
                    value = `¥${totals.totalPaid.toLocaleString()}`;
                  }

                  return (
                    <td key={index} className="border border-gray-400 px-2 py-1 text-sm">
                      {value}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PrintPreview;