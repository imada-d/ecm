import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Building, Phone, Mail, CreditCard } from 'lucide-react';
import api from '../api/client';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVendor, setCurrentVendor] = useState({
    name: '',
    category: '',
    phone: '',
    email: '',
    payment_terms: '',
    default_tax_type: 'included',
    notes: '',
    is_favorite: false
  });

  // 業者一覧取得
  const fetchVendors = async () => {
    try {
      const response = await api.getVendors();
      setVendors(response.data);
    } catch (error) {
      console.error('業者の取得に失敗しました:', error);
      alert('業者の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // モーダルを開く
  const openModal = (vendor = null) => {
    if (vendor) {
      setEditMode(true);
      setCurrentVendor(vendor);
    } else {
      setEditMode(false);
      setCurrentVendor({
        name: '',
        category: '',
        phone: '',
        email: '',
        payment_terms: '',
        default_tax_type: 'included',
        notes: '',
        is_favorite: false
      });
    }
    setShowModal(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false);
    setCurrentVendor({
      name: '',
      category: '',
      phone: '',
      email: '',
      payment_terms: '',
      default_tax_type: 'included',
      notes: '',
      is_favorite: false
    });
  };

  // 業者保存（新規/更新）
  const handleSave = async () => {
    if (!currentVendor.name) {
      alert('業者名を入力してください');
      return;
    }

    try {
      if (editMode) {
        await api.updateVendor(currentVendor.id, currentVendor);
      } else {
        await api.createVendor(currentVendor);
      }
      fetchVendors();
      closeModal();
      alert(editMode ? '業者情報を更新しました' : '業者を登録しました');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    }
  };

  // 業者削除
  const handleDelete = async (id, name) => {
    if (window.confirm(`「${name}」を削除してもよろしいですか？`)) {
      try {
        await api.deleteVendor(id);
        fetchVendors();
        alert('削除しました');
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // カテゴリごとの色
  const getCategoryColor = (category) => {
    const colors = {
      '材料': 'bg-blue-100 text-blue-800',
      '外注': 'bg-red-100 text-red-800',
      '経費': 'bg-green-100 text-green-800',
      'その他': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-6 h-6" />
            業者管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            仕入先・外注業者の情報を管理します
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          業者を追加
        </button>
      </div>

      {/* 業者カード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
          >
            {/* カード上部 */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {vendor.name}
                  {vendor.is_favorite && (
                    <span className="ml-2 text-yellow-500">⭐</span>
                  )}
                </h3>
                {vendor.category && (
                  <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getCategoryColor(vendor.category)}`}>
                    {vendor.category}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(vendor)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="編集"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(vendor.id, vendor.name)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* カード情報 */}
            <div className="space-y-2 text-sm">
              {vendor.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
              {vendor.payment_terms && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="w-3 h-3" />
                  <span>{vendor.payment_terms}</span>
                </div>
              )}
              {vendor.notes && (
                <div className="text-gray-500 text-xs mt-2 border-t pt-2">
                  {vendor.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* データがない場合 */}
      {vendors.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">業者が登録されていません</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            最初の業者を追加
          </button>
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editMode ? '業者情報を編集' : '新規業者登録'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 業者名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  業者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentVendor.name}
                  onChange={(e) => setCurrentVendor({...currentVendor, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="〇〇電気工事"
                />
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={currentVendor.category}
                  onChange={(e) => setCurrentVendor({...currentVendor, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="材料">材料</option>
                  <option value="外注">外注</option>
                  <option value="経費">経費</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              {/* 電話番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={currentVendor.phone}
                  onChange={(e) => setCurrentVendor({...currentVendor, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="000-0000-0000"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={currentVendor.email}
                  onChange={(e) => setCurrentVendor({...currentVendor, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                />
              </div>

              {/* 支払条件 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  支払条件
                </label>
                <input
                  type="text"
                  value={currentVendor.payment_terms}
                  onChange={(e) => setCurrentVendor({...currentVendor, payment_terms: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="月末締め翌月末払い"
                />
              </div>

              {/* 消費税設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  デフォルト消費税設定
                </label>
                <select
                  value={currentVendor.default_tax_type}
                  onChange={(e) => setCurrentVendor({...currentVendor, default_tax_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="included">税込</option>
                  <option value="excluded">税別</option>
                </select>
              </div>

              {/* 備考 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={currentVendor.notes}
                  onChange={(e) => setCurrentVendor({...currentVendor, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="メモ・注意事項など"
                />
              </div>

              {/* よく使うフラグ */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentVendor.is_favorite || false}
                    onChange={(e) => setCurrentVendor({...currentVendor, is_favorite: e.target.checked})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    よく使う業者として登録
                  </span>
                </label>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editMode ? '更新' : '登録'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;