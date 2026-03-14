
import React, { useState, useMemo } from 'react';
import { AppData, Product, SalesInvoice, PaymentMethod, InvoiceDetail, Batch, Customer, AppSettings } from '../types';
import { ShoppingCart, Plus, Minus, Trash, Save, User, UserPlus, Bell, Banknote, CreditCard, AlertTriangle, Truck, History, FileText, ChevronDown, ChevronUp, Gift, ShieldAlert, X, MapPin, Calendar, Settings, Package, Clock } from 'lucide-react';
import { db } from '../services/Database';
import InvoiceModal from './InvoiceModal';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface SalesPOSProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

interface CartItem extends Product {
  quantity: number;
}

// Component for History Row
const HistoryRow: React.FC<{ invoice: SalesInvoice; data: AppData }> = ({ invoice, data }) => {
  const [expanded, setExpanded] = useState(false);
  const details = data.invoiceDetails.filter(d => d.invoiceId === invoice.id);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div 
        className={`flex items-center p-4 hover:bg-slate-50 cursor-pointer transition-colors ${expanded ? 'bg-slate-50' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
         <div className="w-10 text-slate-400">
           {expanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
         </div>
         <div className="flex-1 grid grid-cols-5 gap-4">
            <div className="font-bold text-emerald-700">{invoice.id}</div>
            <div className="text-slate-600 text-sm">{invoice.date}</div>
            <div className="text-slate-800 font-medium">{invoice.customerName}</div>
            <div className="text-slate-600 text-sm">{invoice.employeeName}</div>
            <div className="text-right font-bold text-[#0047AB]">{invoice.totalAmount.toLocaleString()} ₫</div>
         </div>
      </div>
      
      {expanded && (
        <div className="bg-slate-50 px-14 py-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Chi tiết đơn hàng</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="text-left py-2">Mã SP</th>
                <th className="text-left py-2">Tên Thuốc / Sản phẩm</th>
                <th className="text-center py-2">SL</th>
                <th className="text-right py-2">Đơn giá</th>
                <th className="text-right py-2">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {details.map(detail => {
                const product = data.products.find(p => p.id === detail.productId);
                return (
                  <tr key={detail.id} className="border-b border-slate-200/50 last:border-0">
                     <td className="py-2 text-slate-500">{detail.productId}</td>
                     <td className="py-2 font-medium text-slate-800">{product?.name || 'Sản phẩm đã xóa'}</td>
                     <td className="py-2 text-center">{detail.quantity}</td>
                     <td className="py-2 text-right">{detail.unitPrice.toLocaleString()}</td>
                     <td className="py-2 text-right font-bold text-slate-700">
                       {(detail.quantity * detail.unitPrice).toLocaleString()}
                     </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-3 flex flex-col items-end gap-1 text-sm border-t border-slate-200 pt-2">
             {invoice.discountAmount > 0 && (
               <div className="text-emerald-600">Đã dùng {invoice.pointsRedeemed} điểm: -{invoice.discountAmount.toLocaleString()} ₫</div>
             )}
             <div className="flex gap-4">
                <div>Hình thức: <span className="font-medium">{invoice.paymentMethod}</span></div>
                <div>Điểm tích: <span className="font-bold text-orange-500">+{invoice.pointsEarned}</span></div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SalesPOS: React.FC<SalesPOSProps> = ({ data, setData }) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Use config default, fallback to CASH
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(data.appSettings?.defaultPaymentMethod || PaymentMethod.CASH);
  
  // Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<{invoice: SalesInvoice, details: InvoiceDetail[]} | null>(null);

  // New Customer Modal State
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', age: '', address: '' });

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>(data.appSettings || { 
      defaultPaymentMethod: PaymentMethod.CASH, 
      pointValue: 1000, 
      earnRate: 10000 
  });

  // Loyalty State
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const POINT_VALUE = data.appSettings?.pointValue || 1000; 
  const EARN_RATE = data.appSettings?.earnRate || 10000;

  // STYLES for Modal Inputs (Sapphire & Gold Theme)
  const inputClassName = "w-full border border-blue-200 bg-blue-50/50 p-3 rounded-xl text-[#0047AB] placeholder-blue-300 font-medium focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] outline-none transition-all shadow-inner";
  const labelClassName = "text-sm font-bold text-[#0047AB] mb-1 block";

  const selectedCustomer = useMemo(() => {
    return data.customers.find(c => c.phone === customerPhone) || null;
  }, [customerPhone, data.customers]);

  // ALLERGY CHECK FUNCTION
  const checkAllergy = (product: Product, customer: Customer) => {
    if (!customer.medicalHistory || !product.drugDetail) return null;
    
    const history = customer.medicalHistory.toLowerCase();
    const ingredients = product.drugDetail.ingredients.toLowerCase();
    const productName = product.name.toLowerCase();

    // Simple keyword matching for demo
    const riskKeywords = history.split(',').map(s => s.trim()).filter(s => s.length > 2);
    
    for (const keyword of riskKeywords) {
      if (ingredients.includes(keyword) || productName.includes(keyword)) {
        return keyword; // Return the specific allergen
      }
    }
    return null;
  };

  const addToCart = (product: Product) => {
    // 1. ALLERGY WARNING POPUP
    if (selectedCustomer) {
      const allergyRisk = checkAllergy(product, selectedCustomer);
      if (allergyRisk) {
        const confirmAdd = window.confirm(
          `⚠️ CẢNH BÁO DƯỢC LÝ ⚠️\n\nKhách hàng có tiền sử dị ứng với: "${allergyRisk.toUpperCase()}"\nSản phẩm này chứa thành phần tương tự.\n\nBạn có chắc chắn muốn thêm vào đơn hàng không?`
        );
        if (!confirmAdd) return;
      }
    }

    // 2. Check Global Stock
    const totalStock = data.batches
      .filter(b => b.productId === product.id)
      .reduce((acc, b) => acc + b.currentStock, 0);

    const currentInCart = cart.find(i => i.id === product.id)?.quantity || 0;

    if (currentInCart + 1 > totalStock) {
      alert(`Sản phẩm này chỉ còn tồn ${totalStock} ${product.unit}. Không đủ hàng để bán.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        if (delta > 0) {
           const totalStock = data.batches
            .filter(b => b.productId === productId)
            .reduce((acc, b) => acc + b.currentStock, 0);
           if (item.quantity + delta > totalStock) {
             return item; // Do nothing if max stock reached
           }
        }
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleSaveSettings = () => {
    setData(prev => ({
        ...prev,
        appSettings: tempSettings
    }));
    setShowSettings(false);
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalTax = cart.reduce((acc, item) => acc + (item.price * item.quantity * (item.vat / 100)), 0);
  const tempTotal = subtotal + totalTax;

  // LOYALTY LOGIC
  const maxRedeemablePoints = selectedCustomer ? selectedCustomer.loyaltyPoints : 0;
  const discountFromPoints = useLoyaltyPoints ? maxRedeemablePoints * POINT_VALUE : 0;
  const actualDiscount = Math.min(discountFromPoints, tempTotal);
  const pointsToDeduct = useLoyaltyPoints ? Math.ceil(actualDiscount / POINT_VALUE) : 0;
  
  const finalTotal = tempTotal - actualDiscount;
  const newPointsEarned = Math.floor(finalTotal / EARN_RATE);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Giỏ hàng trống!");

    const now = new Date();
    const invoiceId = `HD${Date.now()}`;
    const dateString = now.toLocaleDateString('vi-VN') + " " + now.toLocaleTimeString('vi-VN');

    // Calculate Profit & Tax for Invoice Record
    const totalCost = cart.reduce((acc, item) => acc + ((item.costPrice || 0) * item.quantity), 0);
    const totalProfit = (subtotal - actualDiscount) - totalCost;

    const newInvoice: SalesInvoice = {
      id: invoiceId,
      date: dateString,
      customerId: selectedCustomer?.id || 'KH-VANG-LAI',
      customerName: selectedCustomer?.fullName || 'Khách Vãng Lai',
      customerPhone: customerPhone || 'Không có',
      employeeId: 'NV01', // Mock logged in user
      employeeName: 'Nguyễn Văn A', // Mock logged in user
      totalAmount: finalTotal,
      totalTax: totalTax,
      totalProfit: totalProfit,
      paymentMethod: paymentMethod, 
      storeId: 'CH01',
      totalItems: cart.reduce((acc, item) => acc + item.quantity, 0),
      pointsEarned: selectedCustomer ? newPointsEarned : 0,
      pointsRedeemed: pointsToDeduct,
      discountAmount: actualDiscount
    };

    const newDetails: InvoiceDetail[] = cart.map((item, index) => ({
      id: `CT${invoiceId}_${index}`,
      invoiceId: invoiceId,
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: 0, 
      vat: item.vat
    }));

    // --- FEFO LOGIC (First Expired First Out) ---
    // Deduct stock from Batches automatically
    let updatedBatches = [...data.batches];
    
    console.log("Starting FEFO deduction...");

    cart.forEach(cartItem => {
      let qtyToDeduct = cartItem.quantity;

      // Find all batches for this product
      // Sort by Expiry Date ASC (Nearest expiry first)
      const productBatchesIndices = updatedBatches
        .map((b, index) => ({ ...b, originalIndex: index })) // Keep track of original index
        .filter(b => String(b.productId) === String(cartItem.id) && b.currentStock > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      for (const batch of productBatchesIndices) {
        if (qtyToDeduct <= 0) break;

        const available = batch.currentStock;
        const deduct = Math.min(available, qtyToDeduct);

        // Update the actual batch in the cloned array
        updatedBatches[batch.originalIndex] = {
          ...updatedBatches[batch.originalIndex],
          currentStock: available - deduct
        };

        qtyToDeduct -= deduct;
        console.log(`Deducted ${deduct} from Batch ${batch.id} (Exp: ${batch.expiryDate}). Remaining needed: ${qtyToDeduct}`);
      }
    });

    // Update Customer Points & Last Purchase
    let updatedCustomers = [...data.customers];
    if (selectedCustomer) {
      updatedCustomers = updatedCustomers.map(c => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            loyaltyPoints: c.loyaltyPoints - pointsToDeduct + newPointsEarned,
            lastPurchaseDate: now.toLocaleDateString('vi-VN')
          };
        }
        return c;
      });
    }

    // --- UPDATE STATE LOCALLY ---
    setData(prev => ({
      ...prev,
      salesInvoices: [newInvoice, ...prev.salesInvoices],
      invoiceDetails: [...newDetails, ...prev.invoiceDetails],
      batches: updatedBatches,
      customers: updatedCustomers
    }));
    
    // Sync with SQL DB (Local)
    db.loadData(data.products, updatedBatches);

    // --- SYNC WITH SUPABASE (CLOUD) ---
    if (isSupabaseConfigured) {
        try {
            // 1. Save Invoice Header
            await supabase.from('sales_invoices').insert(newInvoice);
            // 2. Save Invoice Details
            await supabase.from('invoice_details').insert(newDetails);
            
            // 3. Update Customer (Points/Last Purchase)
            if (selectedCustomer) {
                const updatedCustomerData = updatedCustomers.find(c => c.id === selectedCustomer.id);
                if (updatedCustomerData) {
                    await supabase.from('customers').update(updatedCustomerData).eq('id', selectedCustomer.id);
                }
            }
            console.log("Đã lưu hóa đơn thành công lên Supabase");
        } catch (error: any) {
            console.error("Lỗi khi lưu hóa đơn lên Supabase:", error);
            alert(`Lỗi kết nối: Dữ liệu đã được lưu cục bộ nhưng chưa lên mây. ${error?.message || ''}`);
        }
    } else {
        console.log("Chế độ Offline: Hóa đơn đã được lưu vào bộ nhớ tạm.");
    }

    setLastInvoice({ invoice: newInvoice, details: newDetails });
    setShowInvoiceModal(true);

    // Reset UI
    setCart([]);
    setCustomerPhone('');
    setPaymentMethod(data.appSettings.defaultPaymentMethod);
    setUseLoyaltyPoints(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.fullName || !newCustomer.phone) {
      alert("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    const customer: Customer = {
      id: `KH${Date.now()}`,
      fullName: newCustomer.fullName,
      phone: newCustomer.phone,
      age: parseInt(newCustomer.age) || 0,
      address: newCustomer.address || 'Chưa cập nhật',
      loyaltyPoints: 0,
      medicalHistory: '',
      relativeInfo: ''
    };

    // 1. Update Local
    setData(prev => ({
      ...prev,
      customers: [...prev.customers, customer]
    }));

    // 2. Update Cloud (Supabase)
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('customers').insert(customer);
        if (error) {
            console.error("Lỗi khi tạo khách hàng trên Supabase:", error.message);
            alert(`Không thể lưu khách hàng online. ${error.message}`);
        } else {
            console.log("Khách hàng mới đã được lưu vào Supabase");
        }
    } else {
        console.log("Chế độ Offline: Khách hàng mới được lưu cục bộ.");
    }

    // Auto select
    setCustomerPhone(customer.phone);
    setShowAddCustomer(false);
    setNewCustomer({ fullName: '', phone: '', age: '', address: '' });
  };

  const filteredProducts = data.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 relative">
      
      {/* Real-time Notification Bar */}
      <div className="bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white px-4 py-2 rounded-xl shadow-md flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[#FFD700] animate-pulse" />
          <span className="font-bold text-sm tracking-wide">HỆ THỐNG BÁN HÀNG:</span>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'pos' ? 'bg-white text-[#0047AB]' : 'text-blue-200 hover:bg-white/10'}`}
            >
              <ShoppingCart size={14} /> BÁN HÀNG (F1)
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-[#0047AB]' : 'text-blue-200 hover:bg-white/10'}`}
            >
              <History size={14} /> LỊCH SỬ BÁN HÀNG (F2)
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-2 text-blue-200 hover:bg-white/10 hover:text-white"
            >
              <Settings size={14} /> CẤU HÌNH
            </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left: Product Selection */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <input 
                type="text" 
                placeholder="Tìm kiếm thuốc, sản phẩm (Tên, Mã SP)..." 
                className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-blue-50/30 text-[#0047AB] placeholder-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {/* UPDATED GRID: Use specific column counts to ensure cards are sufficiently wide. 
                grid-cols-2 for smaller screens, 3 for large, 4 for extra large.
            */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 content-start">
              {filteredProducts.map(product => {
                // FEFO Logic: Sort batches by Expiry Date
                const productBatches = data.batches
                    .filter(b => String(b.productId) === String(product.id) && b.currentStock > 0)
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                const stock = productBatches.reduce((acc, b) => acc + b.currentStock, 0);
                    
                return (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="border border-slate-200 rounded-xl p-3 bg-white hover:border-[#0047AB] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-full min-h-[220px]"
                  >
                    <div>
                      {/* ID & Stock Badge */}
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{product.id}</span>
                        {stock < 10 && <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full animate-pulse border border-red-100">Còn {stock}</span>}
                      </div>
                      
                      {/* Name */}
                      <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 h-10 leading-snug" title={product.name}>{product.name}</h4>
                      
                      {/* Unit & Price */}
                      <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">{product.unit}</span>
                          <span className="font-bold text-[#0047AB]">{product.price.toLocaleString()} ₫</span>
                      </div>

                      {/* --- BATCH INFO (FEFO) - VERTICAL STACK FOR READABILITY --- */}
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 mt-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1">
                              <span>Lô SX / HSD</span>
                              <span>Tồn</span>
                          </div>
                          
                          {productBatches.length > 0 ? (
                              productBatches.slice(0, 3).map((batch, idx) => {
                                  const isFirst = idx === 0;
                                  return (
                                      <div key={batch.id} className="mb-2 last:mb-0 border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                          {/* Line 1: Batch Number + Stock */}
                                          <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-1.5 overflow-hidden">
                                                  {isFirst && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0"></div>}
                                                  <span className={`font-bold text-xs truncate ${isFirst ? 'text-amber-700' : 'text-slate-700'}`} title={batch.mfgBatchNum}>
                                                      {batch.mfgBatchNum || 'Lô Mới'}
                                                  </span>
                                              </div>
                                              <span className={`font-mono font-bold text-xs px-1.5 rounded border ml-1 ${isFirst ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                 {batch.currentStock}
                                              </span>
                                          </div>
                                          {/* Line 2: Expiry Date */}
                                          <div className={`text-[10px] mt-0.5 ${isFirst ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                                              HSD: {batch.expiryDate}
                                          </div>
                                      </div>
                                  )
                              })
                          ) : (
                              <div className="text-center text-xs text-red-500 py-2 font-medium">Hết hàng</div>
                          )}
                          
                          {productBatches.length > 3 && (
                              <div className="text-[10px] text-center text-slate-400 pt-1 border-t border-slate-200 border-dashed">
                                  + {productBatches.length - 3} lô khác
                              </div>
                          )}
                      </div>
                    </div>

                    <button className="mt-3 w-full bg-blue-50 hover:bg-[#0047AB] text-[#0047AB] hover:text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-blue-100 hover:border-[#0047AB]">
                        <Plus size={14}/> Thêm vào đơn
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart & Checkout - Fixed Width 320px */}
          <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col shrink-0">
            {/* Customer Section */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <User className="text-slate-400" size={18} />
                <span className="text-sm font-medium text-slate-700">Khách Hàng</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nhập SĐT..." 
                  className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-xl bg-blue-50/30 text-[#0047AB] placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
                <button 
                  onClick={() => setShowAddCustomer(true)}
                  className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-[#0047AB] hover:text-white transition-colors"
                  title="Thêm khách hàng mới"
                >
                  <UserPlus size={18} />
                </button>
              </div>
              {selectedCustomer ? (
                <div className="mt-2 text-sm bg-emerald-50 p-2 rounded border border-emerald-100 space-y-1">
                  <div className="font-medium text-emerald-800 flex justify-between">
                     <span className="truncate max-w-[120px]" title={selectedCustomer.fullName}>{selectedCustomer.fullName}</span>
                     <span className="text-xs bg-emerald-200 text-emerald-800 px-1.5 rounded flex items-center">{selectedCustomer.age}t</span>
                  </div>
                  
                  {/* Allergy Warning */}
                  {selectedCustomer.medicalHistory && (
                     <div className="text-xs bg-red-50 text-red-700 p-1 rounded border border-red-100 flex items-start gap-1">
                       <ShieldAlert size={12} className="shrink-0 mt-0.5"/>
                       <span className="line-clamp-2">{selectedCustomer.medicalHistory}</span>
                     </div>
                  )}

                  {/* Loyalty Points */}
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-100/50">
                    <span className="text-xs text-emerald-600 flex items-center gap-1"><Gift size={12}/> Điểm:</span>
                    <span className="font-bold text-orange-500">{selectedCustomer.loyaltyPoints}</span>
                  </div>
                </div>
              ) : customerPhone.length > 0 && (
                <div className="mt-2 text-xs text-slate-500 italic">Khách vãng lai (Mới)</div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart size={48} className="mb-2 opacity-50" />
                  <p>Giỏ hàng trống</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center group">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-slate-800 text-sm truncate" title={item.name}>{item.name}</p>
                      <p className="text-xs text--[#0047AB] font-medium">{item.price.toLocaleString()} ₫</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center bg-slate-100 rounded-lg scale-90 origin-right">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 rounded-l-lg text-slate-600"><Minus size={14} /></button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 rounded-r-lg text-slate-600"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Payment */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              
              {/* Payment Methods */}
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethod === PaymentMethod.CASH 
                        ? 'bg-white border-[#0047AB] text-[#0047AB] shadow-sm ring-1 ring-[#0047AB]' 
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                  >
                    <Banknote size={14} /> Tiền mặt
                  </button>
                  <button 
                    onClick={() => setPaymentMethod(PaymentMethod.TRANSFER)}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethod === PaymentMethod.TRANSFER 
                        ? 'bg-white border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' 
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                  >
                    <CreditCard size={14} /> CK/QR
                  </button>
                </div>
              </div>

              {/* Point Redemption Toggle */}
              {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                <div className="mb-3 flex items-center justify-between bg-orange-50 p-2 rounded-lg border border-orange-100">
                  <div className="text-[10px] text-orange-700 flex items-center gap-1 leading-tight">
                    <Gift size={12} /> Dùng {selectedCustomer.loyaltyPoints}đ (-{(selectedCustomer.loyaltyPoints * POINT_VALUE).toLocaleString()})
                  </div>
                  <div 
                    onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                    className={`w-8 h-4 rounded-full flex items-center transition-colors cursor-pointer shrink-0 ${useLoyaltyPoints ? 'bg-orange-500 justify-end' : 'bg-slate-300 justify-start'}`}
                  >
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm m-0.5"></div>
                  </div>
                </div>
              )}

              {/* Calculation Summary */}
              <div className="space-y-1 mb-3 pt-2 border-t border-slate-200 border-dashed">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()}</span>
                </div>
                {actualDiscount > 0 && (
                   <div className="flex justify-between text-xs text-orange-600 font-medium">
                    <span>Trừ điểm</span>
                    <span>-{actualDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>VAT</span>
                  <span>{totalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-800 pt-1">
                  <span>Tổng</span>
                  <span className="text-[#0047AB]">{finalTotal.toLocaleString()}</span>
                </div>
                 {/* Potential Points */}
                 <div className="text-right text-[10px] text-emerald-600 mt-0.5">
                   + Tích: <b>{newPointsEarned}</b> điểm
                 </div>
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Save size={18} className="text-[#FFD700]" />
                Thanh Toán
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SALES HISTORY TAB */
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div>
               <h3 className="font-bold text-lg text-[#0047AB] flex items-center gap-2">
                 <FileText className="text-emerald-500"/> Nhật Ký Bán Hàng
               </h3>
               <p className="text-xs text-slate-500">Lưu trữ chi tiết giao dịch, nhân viên và khách hàng</p>
             </div>
             <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
               Tổng hóa đơn: <span className="font-bold text-[#0047AB]">{data.salesInvoices.length}</span>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <div className="min-w-[800px]">
               {/* Table Header */}
               <div className="flex items-center p-4 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                  <div className="w-10"></div>
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <div>Mã Hóa Đơn</div>
                    <div>Thời gian</div>
                    <div>Khách hàng</div>
                    <div>Nhân viên bán</div>
                    <div className="text-right">Tổng tiền</div>
                  </div>
               </div>
               
               {/* Table Body */}
               {data.salesInvoices.length === 0 ? (
                 <div className="p-10 text-center text-slate-400">
                    <History size={48} className="mx-auto mb-3 opacity-30"/>
                    Chưa có giao dịch nào được ghi nhận.
                 </div>
               ) : (
                 data.salesInvoices.map(invoice => (
                   <HistoryRow key={invoice.id} invoice={invoice} data={data} />
                 ))
               )}
             </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Popup */}
      {showInvoiceModal && lastInvoice && (
        <InvoiceModal 
          invoice={lastInvoice.invoice} 
          details={lastInvoice.details} 
          data={data}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-[#0047AB]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border-2 border-white/50">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                 <h3 className="font-bold text-[#0047AB] text-lg flex items-center gap-2">
                    <UserPlus size={20} className="text-[#FFD700]"/> Thêm Khách Hàng Mới
                 </h3>
                 <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20}/>
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className={labelClassName}>Họ và Tên <span className="text-red-500">*</span></label>
                    <input 
                       type="text" 
                       className={inputClassName}
                       placeholder="VD: Nguyễn Văn A"
                       value={newCustomer.fullName}
                       onChange={e => setNewCustomer({...newCustomer, fullName: e.target.value})}
                       autoFocus
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className={labelClassName}>Số Điện Thoại <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          className={inputClassName}
                          placeholder="09..."
                          value={newCustomer.phone}
                          onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1">
                       <label className={labelClassName}>Tuổi</label>
                       <input 
                          type="number" 
                          className={inputClassName}
                          placeholder="VD: 30"
                          value={newCustomer.age}
                          onChange={e => setNewCustomer({...newCustomer, age: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className={labelClassName}>Địa chỉ</label>
                    <input 
                       type="text" 
                       className={inputClassName}
                       placeholder="Nhập địa chỉ..."
                       value={newCustomer.address}
                       onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    />
                 </div>
                 <button 
                    onClick={handleCreateCustomer}
                    className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-900/30 transition-all mt-4 border border-[#003380]"
                 >
                    Lưu & Chọn Khách Hàng
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-[#0047AB]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border-2 border-white/50">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                 <h3 className="font-bold text-[#0047AB] text-lg flex items-center gap-2">
                    <Settings size={20} className="text-[#FFD700]"/> Cấu Hình POS
                 </h3>
                 <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20}/>
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 {/* Default Payment Method */}
                 <div className="space-y-1">
                    <label className={labelClassName}>Phương thức thanh toán mặc định</label>
                    <select 
                       className={inputClassName}
                       value={tempSettings.defaultPaymentMethod}
                       onChange={e => setTempSettings({...tempSettings, defaultPaymentMethod: e.target.value as PaymentMethod})}
                    >
                       <option value={PaymentMethod.CASH}>Tiền mặt</option>
                       <option value={PaymentMethod.TRANSFER}>Chuyển khoản</option>
                       <option value={PaymentMethod.CARD}>Thẻ</option>
                    </select>
                 </div>

                 <div className="h-px bg-slate-100 my-2"></div>

                 {/* Loyalty Settings */}
                 <h4 className="text-sm font-bold text-slate-700">Cấu hình Tích Điểm</h4>
                 
                 <div className="space-y-1">
                    <label className={labelClassName}>Tỷ lệ tích điểm (VND / 1 điểm)</label>
                    <div className="relative">
                        <input 
                           type="number" 
                           className={inputClassName}
                           value={tempSettings.earnRate}
                           onChange={e => setTempSettings({...tempSettings, earnRate: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">VNĐ = 1 điểm</span>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className={labelClassName}>Giá trị đổi điểm (1 điểm = VND)</label>
                    <div className="relative">
                        <input 
                           type="number" 
                           className={inputClassName}
                           value={tempSettings.pointValue}
                           onChange={e => setTempSettings({...tempSettings, pointValue: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">VNĐ giảm giá</span>
                    </div>
                 </div>

                 <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-900/30 transition-all mt-4"
                 >
                    Lưu Cấu Hình
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SalesPOS;
