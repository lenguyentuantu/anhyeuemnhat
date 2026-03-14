
import React, { useMemo, useState } from 'react';
import { AppData } from '../types';
import { 
  DollarSign, AlertTriangle, ShoppingBag, Users, TrendingUp, 
  PackageMinus, ChevronRight, X, ArrowRight, Clock, AlertOctagon,
  BarChart3, Pill, Microscope, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';

interface DashboardProps {
  data: AppData;
}

type ModalType = 'none' | 'revenue' | 'inventory_value' | 'low_stock' | 'expiry' | 'customers' | 'categories';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, maxWidth = "max-w-4xl", onClose }) => (
  <div className="fixed inset-0 bg-[#0047AB]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-slide-up`}>
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-[#0047AB] flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#FFD700] rounded-full"></div>
                  {title}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                  <X size={20} />
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50">
              {children}
          </div>
          <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                  Đóng
              </button>
          </div>
      </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [revenueFilter, setRevenueFilter] = useState<'week' | 'month'>('month');

  // --- CALCULATIONS ---

  const totalRevenue = data.salesInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCustomers = data.customers.length;
  
  // 1. REVENUE ANALYSIS DATA (FOR MODAL - Advanced View)
  // Logic retained for the Modal, though chart widget is removed from dashboard view
  const revenueAnalysisData = useMemo(() => {
    const result: { name: string, revenue: number, orders: number }[] = [];
    const today = new Date();

    if (revenueFilter === 'week') {
      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayStr = d.getDate().toString().padStart(2, '0');
        const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
        const dateKey = `${dayStr}/${monthStr}`; // Format DD/MM

        // Sum data for this day
        let dailyRevenue = 0;
        let dailyOrders = 0;

        data.salesInvoices.forEach(inv => {
           // Parse invoice date: "15:30:00 25/10/2023" or similar
           const invDatePart = inv.date.split(' ')[1] || inv.date.split(',')[0]; // Get DD/MM/YYYY
           if (invDatePart.startsWith(dateKey)) { // Simple string match DD/MM
              dailyRevenue += inv.totalAmount;
              dailyOrders += 1;
           }
        });

        result.push({ name: dateKey, revenue: dailyRevenue, orders: dailyOrders });
      }
    } else {
      // Generate 12 months for current year
      const currentYear = today.getFullYear();
      for (let i = 0; i < 12; i++) {
        const monthLabel = `Tháng ${i + 1}`;
        
        let monthlyRevenue = 0;
        let monthlyOrders = 0;

        data.salesInvoices.forEach(inv => {
           const invDatePart = inv.date.split(' ')[1] || inv.date.split(',')[0];
           const [day, month, year] = invDatePart.split('/');
           
           // Check if invoice belongs to this month (index+1)
           // Note: Mock data might have different years, we filter loosely for demo or strictly for year
           if (parseInt(month) === i + 1) { 
              monthlyRevenue += inv.totalAmount;
              monthlyOrders += 1;
           }
        });

        result.push({ name: monthLabel, revenue: monthlyRevenue, orders: monthlyOrders });
      }
    }

    return result;
  }, [data.salesInvoices, revenueFilter]);

  // 2. PRODUCT CATEGORY DATA (New Vertical Bar Chart)
  const categoryChartData = useMemo(() => {
      const counts: Record<string, number> = {};
      data.products.forEach(p => {
          const typeName = data.productTypes.find(t => t.id === p.typeId)?.name || 'Khác';
          counts[typeName] = (counts[typeName] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [data.products, data.productTypes]);

  // 3. INVENTORY ALERTS (Adjusted for MinStock and Manual Request)
  
  // Low Stock Items
  const lowStockItems = useMemo(() => {
    const stockMap = new Map<string, number>();
    data.batches.forEach(b => {
      const current = stockMap.get(b.productId) || 0;
      stockMap.set(b.productId, current + b.currentStock);
    });
    
    const items: {id: string, name: string, stock: number, unit: string, reason: string}[] = [];
    
    // Iterate through ALL products to check stock and request flag
    data.products.forEach(product => {
       const stock = stockMap.get(product.id) || 0; // If no batch, stock is 0
       const minStock = product.minStock || 10;
       
       let reason = '';
       if (product.isImportRequested) {
         reason = 'Yêu cầu thủ công';
       } else if (stock < minStock) {
         reason = `Dưới định mức (${minStock})`;
       }

       if (reason) {
         items.push({ 
           id: product.id, 
           name: product.name, 
           stock, 
           unit: product.unit,
           reason 
         });
       }
    });

    return items.sort((a,b) => a.stock - b.stock);
  }, [data.batches, data.products]);

  // Expiring Items (Next 6 months)
  const expiringItems = useMemo(() => {
      const today = new Date();
      return data.batches
        .filter(b => b.currentStock > 0)
        .map(b => {
            const exp = new Date(b.expiryDate);
            const diffTime = exp.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const product = data.products.find(p => p.id === b.productId);
            return { ...b, productName: product?.name || 'Unknown', diffDays, unit: product?.unit };
        })
        .filter(b => b.diffDays <= 180)
        .sort((a,b) => a.diffDays - b.diffDays);
  }, [data.batches, data.products]);

  // 4. INVENTORY VALUE
  const inventoryValue = useMemo(() => {
    return data.batches.reduce((acc, batch) => {
      const product = data.products.find(p => p.id === batch.productId);
      return acc + (batch.currentStock * (product?.costPrice || 0));
    }, 0);
  }, [data.batches, data.products]);


  // --- COMPONENTS ---

  const InteractiveCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass, type }: any) => (
    <div 
        onClick={() => setActiveModal(type)}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
         <Icon size={80} />
      </div>
      
      <div className="z-10">
        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">{title}</p>
        <h3 className={`text-3xl font-bold ${colorClass.replace('text-', 'text-')}`}>{value}</h3>
      </div>
      
      <div className="z-10 mt-4 flex items-center justify-between">
         <p className={`text-xs font-medium px-2 py-1 rounded-md ${bgClass} ${colorClass}`}>
            {subtext}
         </p>
         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgClass} ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <ArrowRight size={16} />
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-[#0047AB]"/> Tổng quan hoạt động
           </h2>
           <p className="text-slate-500 text-sm">Cập nhật thời gian thực từ hệ thống bán hàng</p>
        </div>
        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 animate-pulse">
           <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Data
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InteractiveCard 
          title="Doanh Thu" 
          value={`${totalRevenue.toLocaleString()} ₫`} 
          subtext="Xem chi tiết hóa đơn" 
          icon={DollarSign} 
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          type="revenue"
        />
        <InteractiveCard 
          title="Giá Trị Kho" 
          value={`${inventoryValue.toLocaleString()} ₫`} 
          subtext="Vốn tồn kho hiện tại" 
          icon={PackageMinus} 
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          type="inventory_value"
        />
        <InteractiveCard 
          title="Cần Nhập Hàng" 
          value={lowStockItems.length} 
          subtext={`${lowStockItems.length} SP cần xử lý`} 
          icon={AlertOctagon} 
          colorClass="text-red-500"
          bgClass="bg-red-50"
          type="low_stock"
        />
        <InteractiveCard 
          title="Khách Hàng" 
          value={totalCustomers} 
          subtext="Tổng hồ sơ bệnh nhân" 
          icon={Users} 
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          type="customers"
        />
      </div>

      {/* CHARTS ROW - MODIFIED: Only Product Category, Expanded */}
      <div className="grid grid-cols-1 gap-6">
        {/* CATEGORY BAR CHART (VERTICAL) - Expanded */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
               <Pill size={24} className="text-blue-500" /> Phân Bố Sản Phẩm Theo Danh Mục
             </h3>
             <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                Tổng số mặt hàng: <span className="font-bold text-[#0047AB]">{data.products.length}</span>
             </div>
          </div>
          <div className="flex-1 min-h-[500px]"> {/* Increased Height */}
             <ResponsiveContainer width="100%" height="100%">
              {/* Vertical Bar Chart: Layout Horizontal means bars go Up-Down. Standard BarChart is Vertical by default. */}
              <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} interval={0} height={40} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => [`${value} sản phẩm`]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={60}> {/* Increased Bar Size */}
                   {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'][index % 6]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CRITICAL ALERTS TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. EXPIRY WARNING TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
                 <h3 className="font-bold text-red-700 flex items-center gap-2">
                    <Clock size={18} /> Thuốc Sắp Hết Hạn
                 </h3>
                 <button onClick={() => setActiveModal('expiry')} className="text-xs font-bold text-red-600 bg-white px-3 py-1 rounded-full border border-red-100 hover:bg-red-50 transition-colors">
                    Xem {expiringItems.length} lô
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                        <tr>
                            <th className="px-5 py-3">Tên thuốc</th>
                            <th className="px-5 py-3">Hạn dùng</th>
                            <th className="px-5 py-3 text-right">Tồn</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expiringItems.slice(0, 5).map(item => (
                            <tr key={item.id} className="hover:bg-red-50/30 transition-colors cursor-pointer" onClick={() => setActiveModal('expiry')}>
                                <td className="px-5 py-3 font-medium text-slate-700">
                                    {item.productName}
                                    <div className="text-[10px] text-slate-400">{item.id}</div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.diffDays < 30 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        Còn {item.diffDays} ngày
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right font-bold text-slate-600">
                                    {item.currentStock}
                                </td>
                            </tr>
                        ))}
                        {expiringItems.length === 0 && (
                            <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Không có thuốc nào sắp hết hạn</td></tr>
                        )}
                    </tbody>
                 </table>
              </div>
          </div>

          {/* 2. LOW STOCK TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-orange-50/50">
                 <h3 className="font-bold text-orange-700 flex items-center gap-2">
                    <AlertTriangle size={18} /> Cần Nhập Hàng
                 </h3>
                 <button onClick={() => setActiveModal('low_stock')} className="text-xs font-bold text-orange-600 bg-white px-3 py-1 rounded-full border border-orange-100 hover:bg-orange-50 transition-colors">
                    Xem {lowStockItems.length} SP
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                        <tr>
                            <th className="px-5 py-3">Tên sản phẩm</th>
                            <th className="px-5 py-3 text-center">Tồn kho</th>
                            <th className="px-5 py-3 text-right">Lý do</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lowStockItems.slice(0, 5).map(item => (
                            <tr key={item.id} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => setActiveModal('low_stock')}>
                                <td className="px-5 py-3 font-medium text-slate-700">
                                    {item.name}
                                </td>
                                <td className="px-5 py-3 text-center font-bold text-slate-800">
                                    {item.stock} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                        {item.reason}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {lowStockItems.length === 0 && (
                            <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Tồn kho ổn định</td></tr>
                        )}
                    </tbody>
                 </table>
              </div>
          </div>

      </div>

      {/* --- MODALS SECTION --- */}

      {/* 1. REVENUE MODAL (REDESIGNED) */}
      {activeModal === 'revenue' && (
          <Modal title="Chi Tiết Doanh Thu" onClose={() => setActiveModal('none')}>
             <div className="p-6">
                {/* Control Tabs */}
                <div className="flex items-center justify-between mb-6">
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                         onClick={() => setRevenueFilter('week')}
                         className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${revenueFilter === 'week' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                      >
                         7 Ngày Gần Nhất
                      </button>
                      <button 
                         onClick={() => setRevenueFilter('month')}
                         className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${revenueFilter === 'month' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                      >
                         Theo Tháng (Năm nay)
                      </button>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-slate-500">Tổng doanh thu hiển thị</div>
                      <div className="text-xl font-bold text-emerald-600">
                         {revenueAnalysisData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()} ₫
                      </div>
                   </div>
                </div>

                {/* Main Line Chart (Improved) */}
                <div className="h-72 w-full mb-8 bg-gradient-to-b from-slate-50 to-white rounded-xl p-4 border border-slate-100">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueAnalysisData}>
                         <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                               <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                         <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={10}
                         />
                         <YAxis 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(val) => `${val/1000}k`} 
                         />
                         <Tooltip 
                            contentStyle={{backgroundColor: '#fff', borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                            formatter={(value: number) => [`${value.toLocaleString()} ₫`, 'Doanh thu']}
                         />
                         <Legend verticalAlign="top" height={36}/>
                         <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            name={revenueFilter === 'week' ? "Doanh Thu Ngày" : "Doanh Thu Tháng"}
                            stroke="#059669" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorRev)" 
                            activeDot={{r: 6, strokeWidth: 0, fill: '#059669'}}
                         />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>

                {/* Data Table */}
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                   <Calendar size={18}/> Dữ liệu chi tiết
                </h4>
                <div className="border rounded-xl overflow-hidden border-slate-200">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-700 font-bold">
                           <tr>
                               <th className="px-6 py-3">Thời gian</th>
                               <th className="px-6 py-3 text-center">Số đơn hàng</th>
                               <th className="px-6 py-3 text-right">Doanh thu</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {revenueAnalysisData.map((item, idx) => (
                               <tr key={idx} className="hover:bg-slate-50">
                                   <td className="px-6 py-3 font-medium text-slate-700">{item.name}</td>
                                   <td className="px-6 py-3 text-center text-slate-500">{item.orders}</td>
                                   <td className="px-6 py-3 text-right font-bold text-emerald-600">{item.revenue.toLocaleString()} ₫</td>
                               </tr>
                           ))}
                           {revenueAnalysisData.every(i => i.revenue === 0) && (
                               <tr><td colSpan={3} className="p-4 text-center text-slate-400">Không có dữ liệu doanh thu trong khoảng thời gian này</td></tr>
                           )}
                       </tbody>
                   </table>
                </div>
             </div>
          </Modal>
      )}

      {/* 2. LOW STOCK MODAL */}
      {activeModal === 'low_stock' && (
          <Modal title="Danh Sách Sản Phẩm Cần Nhập Hàng" onClose={() => setActiveModal('none')}>
             <div className="p-4 bg-orange-50 text-orange-800 text-sm mb-0">
                Bao gồm sản phẩm dưới định mức tồn kho và sản phẩm được yêu cầu nhập thủ công.
             </div>
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-bold sticky top-0">
                     <tr>
                         <th className="px-6 py-4">Mã SP</th>
                         <th className="px-6 py-4">Tên Sản Phẩm</th>
                         <th className="px-6 py-4 text-center">ĐVT</th>
                         <th className="px-6 py-4 text-right">Tồn Kho</th>
                         <th className="px-6 py-4 text-right">Lý do cần nhập</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                     {lowStockItems.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50">
                             <td className="px-6 py-3 font-mono text-slate-500">{item.id}</td>
                             <td className="px-6 py-3 font-medium text-slate-800">{item.name}</td>
                             <td className="px-6 py-3 text-center text-slate-500">{item.unit}</td>
                             <td className="px-6 py-3 text-right font-bold text-red-600 bg-red-50">{item.stock}</td>
                             <td className="px-6 py-3 text-right">
                                {item.reason === 'Yêu cầu thủ công' ? (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                        Thủ công
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                        {item.reason}
                                    </span>
                                )}
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </Modal>
      )}

      {/* 3. EXPIRY MODAL */}
      {activeModal === 'expiry' && (
          <Modal title="Cảnh Báo Thuốc Sắp Hết Hạn (6 tháng)" onClose={() => setActiveModal('none')}>
             <table className="w-full text-sm text-left">
                 <thead className="bg-red-50 text-red-800 uppercase text-xs font-bold sticky top-0">
                     <tr>
                         <th className="px-6 py-4">Lô SX</th>
                         <th className="px-6 py-4">Tên Thuốc</th>
                         <th className="px-6 py-4">Hạn Sử Dụng</th>
                         <th className="px-6 py-4 text-center">Còn lại</th>
                         <th className="px-6 py-4 text-right">Số Lượng</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                     {expiringItems.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50">
                             <td className="px-6 py-3 font-mono text-slate-500">{item.mfgBatchNum}</td>
                             <td className="px-6 py-3 font-medium text-slate-800">{item.productName}</td>
                             <td className="px-6 py-3 text-slate-600">{item.expiryDate}</td>
                             <td className="px-6 py-3 text-center">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${item.diffDays < 30 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                     {item.diffDays} ngày
                                 </span>
                             </td>
                             <td className="px-6 py-3 text-right font-bold text-slate-700">{item.currentStock} {item.unit}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </Modal>
      )}

      {/* 4. CUSTOMERS MODAL */}
      {activeModal === 'customers' && (
          <Modal title="Danh Sách Khách Hàng" onClose={() => setActiveModal('none')}>
             <table className="w-full text-sm text-left">
                 <thead className="bg-purple-50 text-purple-800 uppercase text-xs font-bold sticky top-0">
                     <tr>
                         <th className="px-6 py-4">Họ Tên</th>
                         <th className="px-6 py-4">Số Điện Thoại</th>
                         <th className="px-6 py-4">Tuổi</th>
                         <th className="px-6 py-4 text-right">Điểm Tích Lũy</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                     {[...data.customers].sort((a,b) => b.loyaltyPoints - a.loyaltyPoints).map(c => (
                         <tr key={c.id} className="hover:bg-slate-50">
                             <td className="px-6 py-3 font-bold text-slate-700">{c.fullName}</td>
                             <td className="px-6 py-3 text-slate-500">{c.phone}</td>
                             <td className="px-6 py-3 text-slate-500">{c.age}</td>
                             <td className="px-6 py-3 text-right font-bold text-orange-500">{c.loyaltyPoints}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </Modal>
      )}

      {/* 5. INVENTORY VALUE (Simply re-use products list idea or summary) */}
      {activeModal === 'inventory_value' && (
          <Modal title="Giá Trị Tồn Kho Theo Danh Mục" onClose={() => setActiveModal('none')}>
             <div className="p-6">
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Số lượng mặt hàng" fill="#3b82f6" barSize={50} radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
                 <div className="mt-6 grid grid-cols-2 gap-4">
                    {categoryChartData.map((cat, idx) => (
                        <div key={idx} className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="font-medium text-slate-700">{cat.name}</span>
                            <span className="font-bold text-blue-600">{cat.value} mặt hàng</span>
                        </div>
                    ))}
                 </div>
             </div>
          </Modal>
      )}

    </div>
  );
};

export default Dashboard;
