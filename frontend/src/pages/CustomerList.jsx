import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Users, Phone, Mail, MapPin, User } from 'lucide-react';
import api from '../api/client';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    notes: ''
  });

  // 顧客一覧取得
  const fetchCustomers = async () => {
    try {
      const response = await api.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('顧客の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // モーダルを開く
  const openModal = (customer = null) => {
    if (customer) {
      setEditMode(true);
      setCurrentCustomer(customer);
    } else {
      setEditMode(false);
      setCurrentCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        contact_person: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false);
    setCurrentCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      contact_person: '',
      notes: ''
    });
  };

  // 顧客保存（新規/更新）
  const handleSave = async () => {
    if (!currentCustomer.name) {
      alert('顧客名を入力してください');
      return;
    }

    try {
      if (editMode) {
        await api.updateCustomer(currentCustomer.id, currentCustomer);
      } else {
        await api.createCustomer(currentCustomer);
      }
      fetchCustomers();
      closeModal();
      alert(editMode ? '顧客情報を更新しました' : '顧客を登録しました');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    }
  };

  // 顧客削除
  const handleDelete = async (id, name) => {
    if (window.confirm(`「${name}」を削除してもよろしいですか？`)) {
      try {
        await api.deleteCustomer(id);
        fetchCustomers();
        alert('削除しました');
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました');
      }
    }
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
            <Users className="w-6 h-6" />
            顧客管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            顧客の情報を管理します
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          顧客を追加
        </button>
      </div>

      {/* 顧客カード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
          >
            {/* カード上部 */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {customer.name}
                </h3>
                {customer.contact_person && (
                  <p className="text-sm text-gray-600 mt-1">
                    担当: {customer.contact_person}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(customer)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="編集"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id, customer.name)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* カード情報 */}
            <div className="space-y-2 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                  <span className="text-xs">{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="text-gray-500 text-xs mt-2 border-t pt-2">
                  {customer.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* データがない場合 */}
      {customers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">顧客が登録されていません</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            最初の顧客を追加
          </button>
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editMode ? '顧客情報を編集' : '新規顧客登録'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 顧客名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  顧客名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="株式会社〇〇"
                />
              </div>

              {/* 担当者名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  担当者名
                </label>
                <input
                  type="text"
                  value={currentCustomer.contact_person}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              {/* 電話番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={currentCustomer.phone}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
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
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                />
              </div>

              {/* 住所 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所
                </label>
                <textarea
                  value={currentCustomer.address}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="〇〇県〇〇市〇〇町1-2-3"
                />
              </div>

              {/* 備考 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={currentCustomer.notes}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="メモ・注意事項など"
                />
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

export default CustomerList;