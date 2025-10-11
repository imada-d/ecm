import { useState, useEffect } from 'react';
import api from '../api/client';

function PrintModal({ isOpen, onClose, onPrint }) {
  const [projectPrefixes, setProjectPrefixes] = useState([]);
  const [selectedPrefix, setSelectedPrefix] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [includeGeneralExpense, setIncludeGeneralExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 工事データを取得
      const projectsRes = await api.getProjects();
      const projects = projectsRes.data;

      // 工事番号からプレフィックスを抽出（ハイフンの前の部分）
      const prefixes = new Set();
      projects.forEach(project => {
        const match = project.project_code.match(/^(\d+)-/);
        if (match) {
          prefixes.add(match[1]);
        }
      });
      setProjectPrefixes(Array.from(prefixes).sort());

      // 管理者の場合、ユーザー一覧を取得
      if (isAdmin) {
        const usersRes = await api.getUsers();
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedPrefix) {
      alert('工事番号を選択してください');
      return;
    }

    onPrint({
      prefix: selectedPrefix,
      userId: isAdmin ? selectedUser : currentUser.id,
      includeGeneralExpense
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">工事台帳を印刷</h2>

        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <div className="space-y-4">
            {/* 工事番号選択 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                工事番号（前半）
              </label>
              <select
                value={selectedPrefix}
                onChange={(e) => setSelectedPrefix(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択してください</option>
                {projectPrefixes.map(prefix => (
                  <option key={prefix} value={prefix}>{prefix}</option>
                ))}
              </select>
            </div>

            {/* 担当者選択（管理者のみ） */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  担当者
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="all">全ユーザー</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 全体経費を含めるチェックボックス */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeGeneralExpense}
                  onChange={(e) => setIncludeGeneralExpense(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">全体経費を含める</span>
              </label>
            </div>

            {/* ボタン */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                印刷プレビュー
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrintModal;