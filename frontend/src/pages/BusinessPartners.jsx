import React, { useState } from 'react';
import { Users, Building } from 'lucide-react';
import VendorList from './VendorList';
import CustomerList from './CustomerList';

const BusinessPartners = () => {
  const [activeTab, setActiveTab] = useState('vendors');

  return (
    <div>
      {/* サブタブ */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'vendors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              業者管理
            </div>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              顧客管理
            </div>
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div>
        {activeTab === 'vendors' ? <VendorList /> : <CustomerList />}
      </div>
    </div>
  );
};

export default BusinessPartners;