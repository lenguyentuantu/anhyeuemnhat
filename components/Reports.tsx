
import React, { useMemo, useState } from 'react';
import { AppData, SalesInvoice } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, PieChart, UploadCloud, CheckCircle2, AlertOctagon, 
  DollarSign, FileText, Calendar, X, ArrowRight, ChevronRight, TrendingDown,
  BarChart3
} from 'lucide-react';

interface ReportsProps {
  data: AppData;
}

type ReportModalType = 'none' | 'profit' | 'tax' | 'cost';

const Reports: React.FC<ReportsProps> = ({ data }) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [activeModal, setActiveModal] = useState<ReportModalType>('none');

  // --- Calculations ---

  const totalRevenue = data.salesInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalProfit = data.salesInvoices.reduce((acc, inv) => acc + inv.totalProfit, 0);
  const totalTax = data.salesInvoices.reduce((acc, inv) => acc + inv.totalTax, 0);
  const totalCost = totalRevenue - totalProfit - totalTax;

  // Profit Margin
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Chart Data Preparation
  const chartData = useMemo(() => {
    // Group by Date (DD/MM)
    const grouped: Record<string, { revenue: number, profit: number, tax: number }> = {};
    
    // Sort invoices by date first to ensure chart order
    // Note: Assuming date format is "HH:mm:ss DD/MM/YYYY" or similar where date part is at index 1 or 0
    // Better to parse to timestamp for sort, then group by string
    const sortedInvoices = [...data.salesInvoices].sort((a,b) => {
       const parseDate = (dStr: string) => {
           const parts = dStr.split(' ')[1] || dStr; // Get DD/MM/YYYY
           const [d, m, y] = parts.split('/');
           return new Date(Number(y), Number(m)-1, Number(d)).getTime();
       };
       return parseDate(a.date) - parseDate(b.date);
    });

    sortedInvoices.forEach(inv => {
       const datePart = inv.date.split(' ')[1] || inv.date.split(',')[0];
       const [day, month] = datePart.split('/');
       const key = `${day}/${month}`;
       
       if (!grouped[key]) {
         grouped[key] = { revenue: 0, profit: 0, tax: 0 };
       }
       grouped[key].revenue += inv.totalAmount;
       grouped[key].profit += inv.totalProfit;
       grouped[key].tax += inv.totalTax;
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      ...grouped[key]
    }));
  }, [data.salesInvoices]);

  const handleGPPSync = () => {
    setSyncStatus('syncing');
    // Simulate API Call delay
    setTimeout(() => {
      setSyncStatus('synced');
    }, 2000);
  };

  // --- UI Components ---

  const InteractiveCard = ({ 
    title, value, subtext, icon: Icon, colorClass, bgClass, onClick, type 
  }: { 
    title: string, value: string, subtext: React.ReactNode, icon: any, colorClass: string, bgClass: string, onClick: () => void, type: ReportModalType 
  }) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${activeModal === type ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
    >
       <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
         <Icon size={64} />
       </div>
       <div className="relative z-10">
         <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">{title}</p>
         <h3 className={`text-3xl font-bold mb-2 ${colorClass.replace('text-', 'text-')}`}>{value}</h3>
         <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
           {subtext}
         </div>
         <div className={`mt-4 w-fit px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${bgClass} ${colorClass}`}>
            Xem chi tiết <ArrowRight size={12} />
         </div>
       </div>
    </div>
  );

  const renderModalContent = () => {
    const invoices = [...data.salesInvoices].sort((a, b) => b.id.localeCompare(a.id));

    if (activeModal === 'profit') {
        return (
            <table className="w-full text-sm text-left">
                <thead className="bg-emerald-50 text-emerald-800 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-3 rounded-tl-lg">Mã HĐ</th>
                        <th className="px-6 py-3">Ngày</th>
                        <th className="px-6 py-3 text-right">Doanh Thu</th>
                        <th className="px-6 py-3 text-right">Giá Vốn</th>
                        <th className="px-6 py-3 text-right">Thuế</th>
                        <th className="px-6 py-3 text-right rounded-tr-lg">Lợi Nhuận Ròng</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                    {invoices.map(inv => {
                        const cost = inv.totalAmount - inv.totalProfit - inv.totalTax;
                        return (
                            <tr key={inv.id} className="hover:bg-emerald-50/50">
                                <td className="px-6 py-3 font-medium">{inv.id}</td>
                                <td className="px-6 py-3 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-3 text-right">{inv.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right text-slate-500">{cost.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right text-slate-500">{inv.totalTax.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right font-bold text-emerald-600">+{inv.totalProfit.toLocaleString()}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        );
    }

    if (activeModal === 'tax') {
        return (
            <table className="w-full text-sm text-left">
                <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-3 rounded-tl-lg">Mã HĐ</th>
                        <th className="px-6 py-3">Ngày</th>
                        <th className="px-6 py-3 text-right">Tổng Thanh Toán</th>
                        <th className="px-6 py-3 text-right">Doanh Thu Trước Thuế</th>
                        <th className="px-6 py-3 text-right rounded-tr-lg">Thuế VAT Phải Nộp</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                    {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-blue-50/50">
                            <td className="px-6 py-3 font-medium">{inv.id}</td>
                            <td className="px-6 py-3 text-slate-500">{inv.date}</td>
                            <td className="px-6 py-3 text-right">{inv.totalAmount.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-slate-500">{(inv.totalAmount - inv.totalTax).toLocaleString()}</td>
                            <td className="px-6 py-3 text-right font-bold text-blue-600">{inv.totalTax.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    if (activeModal === 'cost') {
        return (
            <table className="w-full text-sm text-left">
                <thead className="bg-orange-50 text-orange-800 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-3 rounded-tl-lg">Mã HĐ</th>
                        <th className="px-6 py-3">Ngày</th>
                        <th className="px-6 py-3 text-center">Số lượng SP</th>
                        <th className="px-6 py-3 text-right">Tổng Doanh Thu</th>
                        <th className="px-6 py-3 text-right rounded-tr-lg">Giá Vốn Hàng Bán (COGS)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                    {invoices.map(inv => {
                        const cost = inv.totalAmount - inv.totalProfit - inv.totalTax;
                        return (
                            <tr key={inv.id} className="hover:bg-orange-50/50">
                                <td className="px-6 py-3 font-medium">{inv.id}</td>
                                <td className="px-6 py-3 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-3 text-center">{inv.totalItems}</td>
                                <td className="px-6 py-3 text-right">{inv.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right font-bold text-orange-600">-{cost.toLocaleString()}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        );
    }
    return null;
  };

  const getModalTitle = () => {
      switch(activeModal) {
          case 'profit': return { title: 'Chi Tiết Lợi Nhuận Ròng', color: 'text-emerald-700', icon: TrendingUp };
          case 'tax': return { title: 'Báo Cáo Thuế GTGT (VAT)', color: 'text-blue-700', icon: FileText };
          case 'cost': return { title: 'Chi Phí Giá Vốn (COGS)', color: 'text-orange-700', icon: AlertOctagon };
          default: return { title: '', color: '', icon: TrendingUp };
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="text-purple-600"/> Báo Cáo Kinh Doanh & Thuế
          </h2>
          <p className="text-slate-500 text-sm">Phân tích hiệu quả hoạt động và nghĩa vụ thuế</p>
        </div>
        
        {/* GPP Sync Button */}
        <div className="flex items-center gap-3">
           {syncStatus === 'synced' ? (
             <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl font-bold border border-emerald-100">
               <CheckCircle2 size={20} /> Đã đồng bộ Dược Quốc Gia
             </div>
           ) : (
             <button 
               onClick={handleGPPSync}
               disabled={syncStatus === 'syncing'}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                 syncStatus === 'syncing' ? 'bg-slate-400 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30'
               }`}
             >
               {syncStatus === 'syncing' ? (
                 <>Đang gửi dữ liệu...</>
               ) : (
                 <><UploadCloud size={20} /> Gửi Dữ Liệu Cục QLD (GPP)</>
               )}
             </button>
           )}
        </div>
      </div>

      {/* KPI Cards (Interactive) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InteractiveCard 
          title="Lợi Nhuận Ròng"
          value={`${totalProfit.toLocaleString()} ₫`}
          type="profit"
          icon={DollarSign}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50"
          onClick={() => setActiveModal('profit')}
          subtext={
             <>
               <TrendingUp size={14} className="text-emerald-500"/> 
               <span className="text-emerald-600 font-bold">Tỷ suất: {profitMargin.toFixed(1)}%</span>
             </>
          }
        />

        <InteractiveCard 
          title="Tổng Thuế (VAT)"
          value={`${totalTax.toLocaleString()} ₫`}
          type="tax"
          icon={FileText}
          colorClass="text-blue-500"
          bgClass="bg-blue-50"
          onClick={() => setActiveModal('tax')}
          subtext={<span>Nghĩa vụ thuế cần nộp</span>}
        />

        <InteractiveCard 
          title="Chi Phí Nhập Hàng"
          value={`${totalCost.toLocaleString()} ₫`}
          type="cost"
          icon={AlertOctagon}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
          onClick={() => setActiveModal('cost')}
          subtext={<span>Giá vốn hàng bán (COGS)</span>}
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-slate-800">Biểu đồ Lợi Nhuận vs Doanh Thu</h3>
           <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setTimeRange('week')}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === 'week' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
             >
               7 Ngày
             </button>
             <button 
               onClick={() => setTimeRange('month')}
               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === 'month' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
             >
               Tháng Này
             </button>
           </div>
        </div>
        
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} ₫`]}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area type="monotone" name="Doanh Thu" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" name="Lợi Nhuận" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
               <BarChart3 size={48} className="mb-2 opacity-50"/>
               <p className="font-medium">Chưa có dữ liệu giao dịch</p>
               <p className="text-xs">Bán hàng để xem biểu đồ tăng trưởng</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 bg-[#002366]/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        {(() => {
                            const { title, color, icon: Icon } = getModalTitle();
                            return (
                                <>
                                    <div className={`p-2 rounded-lg bg-white shadow-sm ${color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className={`text-xl font-bold ${color}`}>{title}</h3>
                                </>
                            )
                        })()}
                    </div>
                    <button 
                        onClick={() => setActiveModal('none')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {renderModalContent()}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                    <button 
                        onClick={() => setActiveModal('none')}
                        className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
