import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, ChevronDown, ChevronUp, X, Save, Calendar, FileText } from 'lucide-react';
import api from '../api/client';

const ProjectDetail = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [costs, setCosts] = useState([]);
  const [projectUser, setProjectUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showCostForm, setShowCostForm] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [showCostEditModal, setShowCostEditModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // インライン編集用のステート
  const [isEditingInline, setIsEditingInline] = useState({
    invoice_date: false,
    payment_date: false,
    status: false,
    notes: false
  });
  const [inlineEditValues, setInlineEditValues] = useState({});
  
  const [costFormData, setCostFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    amount: '',
    category: '材料費',
    tax_type: 'included'
  });
  
  const fetchProjectData = async () => {
  try {
    const projectRes = await api.getProjectById(projectId);
    setProject(projectRes.data);
    
    // 現在のユーザー情報を取得
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // 管理者の場合は担当者情報を取得
      if (user.role === 'admin' && projectRes.data.user_id) {
        try {
          const usersRes = await api.getUsers();
          const foundUser = usersRes.data.find(u => u.id === projectRes.data.user_id);
          setProjectUser(foundUser);
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else if (projectRes.data.user_id === user.id) {
        // 自分のプロジェクトの場合
        setProjectUser(user);
      }
    }
      setInlineEditValues({
        invoice_date: projectRes.data.invoice_date ? projectRes.data.invoice_date.split('T')[0] : '',
        payment_date: projectRes.data.payment_date ? projectRes.data.payment_date.split('T')[0] : '',
        status: projectRes.data.status,
        notes: projectRes.data.notes || ''
      });
      
      const costsRes = await api.getCosts({ project_id: parseInt(projectId) });
      const filteredCosts = costsRes.data.filter(cost => 
        cost.project_id === parseInt(projectId)
      );
      setCosts(filteredCosts);
      
      const categoriesRes = await api.getCategories();
      setCategories(categoriesRes.data);
      
      const vendorsRes = await api.getVendors();
      const customersRes = await api.getCustomers();
      setCustomers(customersRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('エラー発生:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // インライン編集の保存
  const handleInlineSave = async (field) => {
    try {
      const updateData = {
        ...project,
        [field]: inlineEditValues[field] || null
      };
      
      // 空文字をnullに変換
      if (field === 'invoice_date' || field === 'payment_date') {
        updateData[field] = inlineEditValues[field] || null;
      }
      
      await api.updateProject(project.id, updateData);
      
      // 成功したら表示を更新
      setProject({...project, [field]: inlineEditValues[field]});
      setIsEditingInline({...isEditingInline, [field]: false});
      
      // データを再取得
      fetchProjectData();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('更新に失敗しました');
    }
  };

  // インライン編集のキャンセル
  const handleInlineCancel = (field) => {
    setInlineEditValues({
      ...inlineEditValues,
      [field]: project[field] ? (field.includes('date') ? project[field].split('T')[0] : project[field]) : ''
    });
    setIsEditingInline({...isEditingInline, [field]: false});
  };

  // 編集モーダルを開く（その他の項目用）
  const handleEdit = () => {
    setEditingProject({
      ...project,
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : '',
      invoice_date: project.invoice_date ? project.invoice_date.split('T')[0] : '',
      payment_date: project.payment_date ? project.payment_date.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // 編集を保存
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editingProject,
        contract_amount: editingProject.contract_amount ? parseInt(editingProject.contract_amount) : 0,
        start_date: editingProject.start_date || null,
        end_date: editingProject.end_date || null,
        invoice_date: editingProject.invoice_date || null,
        payment_date: editingProject.payment_date || null,
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          updateData[key] = null;
        }
      });
      
      await api.updateProject(editingProject.id, updateData);
      alert('更新しました');
      fetchProjectData();
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('更新に失敗しました');
    }
  };

  // 原価登録（既存のコード）
  const handleCostSubmit = async (e) => {
    e.preventDefault();
    
    if (!costFormData.vendor || !costFormData.amount) {
      alert('業者名と金額は必須です');
      return;
    }

    try {
      const submitData = {
        ...costFormData,
        project_id: parseInt(projectId),
        amount: parseInt(costFormData.amount),
        total_amount: parseInt(costFormData.amount)
      };
      
      await api.createCost(submitData);
      alert('原価を登録しました！');
      
      setCostFormData({
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        description: '',
        amount: '',
        category: '材料費',
        tax_type: 'included'
      });
      
      fetchProjectData();
    } catch (error) {
      console.error('Error creating cost:', error);
      alert('エラーが発生しました');
    }
  };

  // 原価編集
  const handleEditCost = (cost) => {
    setEditingCost({
      ...cost,
      date: cost.date.split('T')[0]
    });
    setShowCostEditModal(true);
  };

  // 原価編集保存
  const handleSaveCostEdit = async () => {
    try {
      const updateData = {
        ...editingCost,
        amount: parseInt(editingCost.amount),
        total_amount: parseInt(editingCost.amount)
      };
      
      await api.updateCost(editingCost.id, updateData);
      alert('原価を更新しました');
      fetchProjectData();
      setShowCostEditModal(false);
      setEditingCost(null);
    } catch (error) {
      console.error('Error updating cost:', error);
      alert('更新に失敗しました');
    }
  };

  // 原価削除
  const handleDeleteCost = async (costId) => {
    if (!confirm('この原価データを削除してもよろしいですか？')) return;
    
    try {
      await api.deleteCost(costId);
      alert('削除しました');
      fetchProjectData();
    } catch (error) {
      console.error('Error deleting cost:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          工事台帳に戻る
        </button>
        <p>プロジェクトが見つかりません（ID: {projectId}）</p>
      </div>
    );
  }

  const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const contractAmount = project.contract_amount || 0;
  const grossProfit = contractAmount - totalCost;
  const grossProfitRate = contractAmount > 0 ? (grossProfit / contractAmount * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          工事台帳に戻る
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {project.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                工事番号: {project.project_code} | 顧客: {project.client_name || '-'}
                {project.estimate_number && (
                  <span className="ml-2">| 見積番号: {project.estimate_number}</span>
                )}
                {projectUser && (
                  <span className="ml-2">| 担当: {projectUser.name}{projectUser.staff_code ? ` (${projectUser.staff_code})` : ''}</span>
                )}
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-600">
                  開始日: {project.start_date ? new Date(project.start_date).toLocaleDateString('ja-JP') : '-'}
                </span>
                <span className="text-gray-600">
                  終了予定: {project.end_date ? new Date(project.end_date).toLocaleDateString('ja-JP') : '-'}
                </span>
              </div>
              
              {/* インライン編集可能なフィールド */}
              <div className="mt-3 space-y-2">
                {/* 請求日 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-20">請求日:</span>
                  {isEditingInline.invoice_date ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={inlineEditValues.invoice_date}
                        onChange={(e) => setInlineEditValues({...inlineEditValues, invoice_date: e.target.value})}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleInlineSave('invoice_date')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleInlineCancel('invoice_date')}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${project.invoice_date ? 'text-green-600' : 'text-red-600'}`}>
                        {project.invoice_date ? new Date(project.invoice_date).toLocaleDateString('ja-JP') : '未請求'}
                      </span>
                      <button
                        onClick={() => setIsEditingInline({...isEditingInline, invoice_date: true})}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 入金日 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-20">入金日:</span>
                  {isEditingInline.payment_date ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={inlineEditValues.payment_date}
                        onChange={(e) => setInlineEditValues({...inlineEditValues, payment_date: e.target.value})}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleInlineSave('payment_date')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleInlineCancel('payment_date')}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${project.payment_date ? 'text-green-600' : 'text-orange-600'}`}>
                        {project.payment_date ? new Date(project.payment_date).toLocaleDateString('ja-JP') : '未入金'}
                      </span>
                      <button
                        onClick={() => setIsEditingInline({...isEditingInline, payment_date: true})}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ステータス */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-20">状態:</span>
                  {isEditingInline.status ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={inlineEditValues.status}
                        onChange={(e) => setInlineEditValues({...inlineEditValues, status: e.target.value})}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="active">進行中</option>
                        <option value="completed">完了</option>
                        <option value="cancelled">中止</option>
                      </select>
                      <button
                        onClick={() => handleInlineSave('status')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleInlineCancel('status')}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.status === 'active' ? '進行中' : 
                         project.status === 'completed' ? '完了' : '中止'}
                      </span>
                      <button
                        onClick={() => setIsEditingInline({...isEditingInline, status: true})}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* メモ（インライン編集可能） */}
              <div className="mt-3">
                {isEditingInline.notes ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">メモ編集中</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInlineSave('notes')}
                          className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" /> 保存
                        </button>
                        <button
                          onClick={() => handleInlineCancel('notes')}
                          className="text-gray-600 hover:text-gray-700 text-sm flex items-center gap-1"
                        >
                          <X className="w-4 h-4" /> キャンセル
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={inlineEditValues.notes}
                      onChange={(e) => setInlineEditValues({...inlineEditValues, notes: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm"
                      rows="3"
                      placeholder="工事に関するメモ・備考など"
                    />
                  </div>
                ) : (
                  <div 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsEditingInline({...isEditingInline, notes: true})}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">メモ</span>
                      <FileText className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">
                      {project.notes || 'クリックしてメモを追加'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* その他の項目を編集するボタン */}
            <button
              onClick={handleEdit}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              編集
            </button>
          </div>
        </div>
      </div>

      {/* 収支サマリー（既存のコード） */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">受注金額</div>
          <div className="text-xl font-bold">¥{contractAmount.toLocaleString()}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">原価合計</div>
          <div className="text-xl font-bold text-red-600">¥{totalCost.toLocaleString()}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">粗利益</div>
          <div className={`text-xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ¥{grossProfit.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">粗利率</div>
          <div className={`text-xl font-bold ${
            grossProfitRate >= 30 ? 'text-green-600' :
            grossProfitRate >= 20 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {grossProfitRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 以下、原価入力フォームと原価明細は既存のコードのまま */}
      {/* 原価入力フォーム（折りたたみ可能） */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div 
          onClick={() => setShowCostForm(!showCostForm)}
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold">📝 原価入力</h3>
          {showCostForm ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {showCostForm && (
          <div className="p-6 border-t">
            <form onSubmit={handleCostSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={costFormData.date}
                    onChange={(e) => setCostFormData({...costFormData, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                {/* カテゴリ（クイックボタン） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <div className="flex flex-wrap gap-1">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCostFormData({...costFormData, category: cat.name})}
                        className={`text-xs px-3 py-1 rounded transition-colors ${
                          costFormData.category === cat.name 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 業者（クイックボタン付き） */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    業者名 <span className="text-red-500">*</span>
                  </label>
                  
                  {/* よく使う業者のクイックボタン */}
                  {vendors.filter(v => v.is_favorite).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-gray-500 mr-1">よく使う:</span>
                      {vendors.filter(v => v.is_favorite).map(vendor => (
                        <button
                          key={vendor.id}
                          type="button"
                          onClick={() => setCostFormData({...costFormData, vendor: vendor.name})}
                          className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
                        >
                          {vendor.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* カテゴリの業者のクイックボタン */}
                  {costFormData.category && vendors.filter(v => v.category === costFormData.category && !v.is_favorite).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-gray-500 mr-1">{costFormData.category}:</span>
                      {vendors
                        .filter(v => v.category === costFormData.category && !v.is_favorite)
                        .slice(0, 5)
                        .map(vendor => (
                          <button
                            key={vendor.id}
                            type="button"
                            onClick={() => setCostFormData({...costFormData, vendor: vendor.name})}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            {vendor.name}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="text"
                      list="vendor-list-detail"
                      value={costFormData.vendor}
                      onChange={(e) => setCostFormData({...costFormData, vendor: e.target.value})}
                      className="w-full border rounded px-3 py-2 pr-8"
                      placeholder="業者名を入力または選択"
                      required
                    />
                    <datalist id="vendor-list-detail">
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.name} />
                      ))}
                    </datalist>
                    {costFormData.vendor && (
                      <button
                        type="button"
                        onClick={() => setCostFormData({...costFormData, vendor: ''})}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={costFormData.amount}
                    onChange={(e) => setCostFormData({...costFormData, amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例: 10000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容/摘要</label>
                  <input
                    type="text"
                    value={costFormData.description}
                    onChange={(e) => setCostFormData({...costFormData, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例: ケーブル購入"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">消費税</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCostFormData({...costFormData, tax_type: 'included'})}
                      className={`flex-1 px-3 py-2 rounded transition-colors ${
                        costFormData.tax_type === 'included'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      税込
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostFormData({...costFormData, tax_type: 'excluded'})}
                      className={`flex-1 px-3 py-2 rounded transition-colors ${
                        costFormData.tax_type === 'excluded'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      税別
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white rounded px-6 py-2 hover:bg-blue-600"
                >
                  登録
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 原価明細 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-4">📊 原価明細</h3>
        {costs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">業者</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">内容</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costs.map((cost) => {
                  const categoryColors = {
                    '材料費': 'bg-blue-100 text-blue-800',
                    '外注費': 'bg-red-100 text-red-800',
                    '経費': 'bg-green-100 text-green-800',
                    'その他': 'bg-gray-100 text-gray-800',
                  };
                  
                  return (
                    <tr key={cost.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {new Date(cost.date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{cost.vendor}</td>
                      <td className="px-4 py-3 text-sm">{cost.description || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          categoryColors[cost.category] || 'bg-purple-100 text-purple-800'
                        }`}>
                          {cost.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                        ¥{cost.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => handleEditCost(cost)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">原価データがありません</p>
        )}
      </div>

      {/* 編集モーダル（その他の項目用） */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">工事情報を編集</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事番号</label>
                  <input
                    type="text"
                    value={editingProject.project_code}
                    onChange={(e) => setEditingProject({...editingProject, project_code: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事名</label>
                  <input
                    type="text"
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">顧客名</label>
                  <input
                    type="text"
                    list="customer-list-modal"
                    value={editingProject.client_name || ''}
                    onChange={(e) => setEditingProject({...editingProject, client_name: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="選択または入力"
                  />
                  <datalist id="customer-list-modal">
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">見積番号</label>
                  <input
                    type="text"
                    value={editingProject.estimate_number || ''}
                    onChange={(e) => setEditingProject({...editingProject, estimate_number: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例: Q-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">受注金額（円）</label>
                  <input
                    type="number"
                    value={editingProject.contract_amount || ''}
                    onChange={(e) => setEditingProject({...editingProject, contract_amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={editingProject.start_date || ''}
                    onChange={(e) => setEditingProject({...editingProject, start_date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了予定日</label>
                  <input
                    type="date"
                    value={editingProject.end_date || ''}
                    onChange={(e) => setEditingProject({...editingProject, end_date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 原価編集モーダル（既存のコードのまま） */}
      {showCostEditModal && editingCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">原価編集</h3>
              <button
                onClick={() => setShowCostEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={editingCost.date}
                    onChange={(e) => setEditingCost({...editingCost, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">業者名</label>
                  <input
                    type="text"
                    value={editingCost.vendor}
                    onChange={(e) => setEditingCost({...editingCost, vendor: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                  <input
                    type="number"
                    value={editingCost.amount}
                    onChange={(e) => setEditingCost({...editingCost, amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={editingCost.category}
                    onChange={(e) => setEditingCost({...editingCost, category: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                  <textarea
                    value={editingCost.description || ''}
                    onChange={(e) => setEditingCost({...editingCost, description: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCostEditModal(false)}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveCostEdit}
                className="bg-blue-500 text-white rounded px-4 py-2"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;