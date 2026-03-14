
import React, { useState } from 'react';
import { AppData, Batch } from '../types';
import { Package, Search, Calendar, AlertTriangle, FileText, Clock } from 'lucide-react';

interface InventoryProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const Inventory: React.FC<InventoryProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'import' | 'expiry'>('batches');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = data.batches.filter(b => {
    const product = data.products.find(p => p.id === b.productId);
    const searchString = `${b.id} ${product?.name} ${b.mfgBatchNum}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Expiry Logic: Filter batches expiring in next 180 days (6 months) or already expired
  const expiringBatches = data.batches
    .filter(b => b.currentStock > 0) // Only count items in stock
    .map(b => {
      const today = new Date();
      const exp = new Date(b.expiryDate);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...b, diffDays };
    })
    .filter(b => b.diffDays <= 180) // 6 months
    .sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản Lý Kho & Lô Hàng</h2>
          <p className="text-sm text-slate-500">Theo dõi tồn kho, hạn sử dụng và lịch sử nhập hàng</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'batches' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Danh sách Lô hàng
          </button>
           <button
            onClick={() => setActiveTab('expiry')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'expiry' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle size={14}/> Cảnh báo Hết hạn
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'import' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lịch sử Nhập hàng
          </button>
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0047AB]" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm lô hàng, tên thuốc..."
                className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-xl bg-blue-50/30 text-[#0047AB] placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">ID Lô</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Sản Phẩm</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Số Lô NSX</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Ngày SX</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Hạn SD</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Tồn kho</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(batch => {
                  const product = data.products.find(p => p.id === batch.productId);
                  const daysToExpiry = Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  
                  let status = <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Còn hạn</span>;
                  if (daysToExpiry < 0) status = <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">Hết hạn</span>;
                  else if (daysToExpiry < 90) status = <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold">Sắp hết hạn</span>;

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-mono text-slate-500">{batch.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{product?.name}</div>
                        <div className="text-xs text-slate-400">{batch.productId}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{batch.mfgBatchNum}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{batch.mfgDate}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{batch.expiryDate}</td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-800 text-right">{batch.currentStock.toLocaleString()}</td>
                      <td className="py-3 px-4">{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBatches.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>Không tìm thấy lô hàng nào</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'expiry' && (
        <div className="space-y-4 animate-fade-in">
           <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
             <AlertTriangle className="text-red-500 shrink-0" />
             <div>
               <h3 className="font-bold text-red-700">Báo cáo Cận Date (Dưới 6 tháng)</h3>
               <p className="text-sm text-red-600/80">
                 Danh sách các lô hàng cần ưu tiên bán gấp hoặc làm thủ tục trả hàng nhà cung cấp. 
                 Hệ thống bán hàng sẽ tự động ưu tiên xuất các lô này trước (FEFO).
               </p>
             </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Sản phẩm</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Lô & Hạn SD</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Thời gian còn lại</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Tồn kho</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Hành động gợi ý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringBatches.map(batch => {
                   const product = data.products.find(p => p.id === batch.productId);
                   let colorClass = "text-yellow-600 bg-yellow-50";
                   let actionText = "Theo dõi";
                   
                   if (batch.diffDays < 0) {
                     colorClass = "text-white bg-red-600";
                     actionText = "Hủy / Trả hàng";
                   } else if (batch.diffDays < 90) {
                     colorClass = "text-red-600 bg-red-100";
                     actionText = "Khuyến mãi / Đẩy hàng";
                   }

                   return (
                     <tr key={batch.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                           <div className="font-bold text-slate-800">{product?.name}</div>
                           <div className="text-xs text-slate-400">{batch.productId}</div>
                        </td>
                        <td className="py-3 px-4">
                           <div className="text-sm font-mono">{batch.id}</div>
                           <div className="text-xs text-slate-500">HSD: {batch.expiryDate}</div>
                        </td>
                        <td className="py-3 px-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${colorClass}`}>
                             {batch.diffDays < 0 ? `Đã quá ${Math.abs(batch.diffDays)} ngày` : `Còn ${batch.diffDays} ngày`}
                           </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">
                          {batch.currentStock.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 italic">
                          {actionText}
                        </td>
                     </tr>
                   )
                })}
              </tbody>
             </table>
             {expiringBatches.length === 0 && (
                <div className="p-8 text-center text-emerald-600 bg-emerald-50">
                   <Clock size={48} className="mx-auto mb-2 opacity-50"/>
                   <p className="font-medium">Tuyệt vời! Không có lô hàng nào sắp hết hạn trong 6 tháng tới.</p>
                </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'import' && (
         <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-100 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-600">Tính năng đang cập nhật</h3>
            <p className="text-sm text-slate-400 mt-1">Chức năng tạo phiếu nhập và chi tiết phiếu nhập sẽ hiển thị ở đây.</p>
         </div>
      )}
    </div>
  );
};

export default Inventory;
