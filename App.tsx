import { AuthProvider } from './contexts/AuthContext';
import { MockLogin } from './components/MockLogin';
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import SalesPOS from './components/SalesPOS';
import Inventory from './components/Inventory';
import EmployeeList from './components/EmployeeList';
import CustomerList from './components/CustomerList';
import SupplierList from './components/SupplierList';
import Reports from './components/Reports';
import Auth from './components/Auth';
import SupabaseSetupInstructions from './components/SupabaseSetupInstructions';
import { initialData, getCountryId, determineType } from './services/mockData';
import { AppData, Employee, Product, Customer, SalesInvoice, InvoiceDetail, Supplier, Batch } from './types';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { db } from './services/Database';
import { useSupabaseTable } from './hooks/useSupabaseTable';
import { UploadCloud, Loader2, Database } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // App Data State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppData>(initialData);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Database Setup State
  const [showSupabaseSetup, setShowSupabaseSetup] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  // --- SUPABASE HOOKS ---
  const { data: custData, error: custError, loading: custLoading } = useSupabaseTable<Customer>('customers');
  const { data: empData, error: empError, loading: empLoading } = useSupabaseTable<Employee>('employees');
  const { data: invData, error: invError, loading: invLoading } = useSupabaseTable<SalesInvoice>('sales_invoices');
  const { data: detData, error: detError, loading: detLoading } = useSupabaseTable<InvoiceDetail>('invoice_details');
  const { data: supData, error: supError, loading: supLoading } = useSupabaseTable<Supplier>('suppliers');
  const { data: rawProdData, error: prodError, loading: prodLoading, refresh: refreshProducts } = useSupabaseTable<any>('products');

  const isDataLoading = custLoading || empLoading || invLoading || detLoading || supLoading || prodLoading;

  // --- SYNC DATA FROM HOOKS TO STATE ---
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("⚠️ Supabase chưa được cấu hình. Chạy Offline.");
      setAppLoading(false);
      return;
    }

    if (isDataLoading) return;

    // Check errors
    const errors = [custError, empError, invError, detError, supError, prodError];
    const missingTableError = errors.find((e: any) => e && (
        e.code === '42P01' || 
        e.message?.includes('Could not find the table')
    ));

    if (missingTableError) {
        setShowSupabaseSetup(true);
        setAppLoading(false);
        return;
    }

    // 1. Transform Products form DB
    let mappedProducts: Product[] = [];
    if (rawProdData && rawProdData.length > 0) {
        mappedProducts = rawProdData.map((p: any) => ({
            id: p.id.toString(), // ID from DB (e.g., "1", "2")
            name: p.ten_thuoc || 'Unknown',
            typeId: determineType(p.ten_thuoc, p.hoat_chat),
            countryId: getCountryId(p.nuoc_san_xuat),
            unit: p.don_vi_tinh || 'Đơn vị',
            price: Number(p.gia_ban) || 0,
            costPrice: Number(p.gia_ban) * 0.75,
            vat: 5,
            isDrug: true,
            minStock: 10,
            isImportRequested: false,
            drugDetail: {
                ingredients: p.hoat_chat || '',
                concentration: p.ham_luong || '',
                dosageForm: p.dang_bao_che || '',
                packaging: p.quy_cach_dong_goi || '',
                manufacturer: p.cong_ty || '',
                usage: 'Theo chỉ định',
                regNumber: ''
            }
        }));
    }

    // Helper: Merge Lists
    const mergeLists = (mock: any[], real: any[]) => {
        if (!real || real.length === 0) return mock;
        const realIds = new Set(real.map(i => i.id));
        return [...mock.filter(m => !realIds.has(m.id)), ...real];
    };

    // Update State
    setData(prev => {
        // A. Determine Base Products
        let finalProducts = mappedProducts.length > 0 ? mappedProducts : initialData.products;

        // B. FORCE INCLUDE MISSING CRITICAL ITEMS (Que thu thai, Bao cao su)
        // If the DB doesn't have them, inject them from initialData
        const criticalKeywords = ['bao cao su', 'que thử', 'durex', 'quickstick'];
        const hasCriticalItems = finalProducts.some(p => 
            criticalKeywords.some(k => p.name.toLowerCase().includes(k))
        );

        if (!hasCriticalItems) {
            const missingItems = initialData.products.filter(p => 
                criticalKeywords.some(k => p.name.toLowerCase().includes(k))
            );
            // Append distinct missing items
            const existingNames = new Set(finalProducts.map(p => p.name));
            const itemsToAdd = missingItems.filter(p => !existingNames.has(p.name));
            finalProducts = [...itemsToAdd, ...finalProducts];
        }

        // C. FIX "0 STOCK" ISSUE: Generate Batches for ALL Products
        // We look at the FINAL list of products. If a product ID doesn't exist in the current batches,
        // we create a fake batch for it. This fixes the mismatch between Supabase IDs (1, 2) and Mock Batch IDs (SP...)
        
        // 1. Get existing valid batches (remove orphans)
        const activeProductIds = new Set(finalProducts.map(p => p.id));
        let validBatches = prev.batches.filter(b => activeProductIds.has(b.productId));
        
        // 2. Identify products without batches
        const productsWithStock = new Set(validBatches.map(b => b.productId));
        const productsNeedingStock = finalProducts.filter(p => !productsWithStock.has(p.id));

        // 3. Generate batches for them
        const newGeneratedBatches: Batch[] = productsNeedingStock.map(p => {
             const mfgDate = new Date();
             mfgDate.setMonth(mfgDate.getMonth() - Math.floor(Math.random() * 12));
             const expiryDate = new Date(mfgDate);
             expiryDate.setMonth(expiryDate.getMonth() + 24); // 2 years expiry

             return {
                 id: `AUTO-LO-${p.id}`,
                 productId: p.id.toString(), // FORCE STRING TO MATCH PRODUCT ID
                 mfgBatchNum: `BATCH-${Math.floor(Math.random() * 10000)}`,
                 mfgDate: mfgDate.toISOString().split('T')[0],
                 expiryDate: expiryDate.toISOString().split('T')[0],
                 currentStock: Math.floor(Math.random() * 100) + 20 // Ensure > 0 stock
             };
        });

        return {
            ...prev,
            customers: mergeLists(prev.customers, custData || []),
            employees: mergeLists(prev.employees, empData || []),
            salesInvoices: mergeLists(prev.salesInvoices, invData || []),
            invoiceDetails: mergeLists(prev.invoiceDetails, detData || []),
            suppliers: mergeLists(prev.suppliers, supData || []),
            products: finalProducts,
            batches: [...validBatches, ...newGeneratedBatches] // Combine existing valid batches + new ones
        };
    });

    setAppLoading(false);

  }, [isDataLoading, custData, empData, invData, detData, supData, rawProdData]);

  // Update In-Memory DB
  useEffect(() => {
    if (data.products.length > 0) {
      db.loadData(data.products, data.batches);
    }
  }, [data.products, data.batches]);

  // Handle Sync to Cloud
  const handleSyncToCloud = async () => {
    if (!isSupabaseConfigured) return;
    setIsSyncing(true);
    
    try {
        const productsToSync = initialData.products.map(p => ({
            ten_thuoc: p.name,
            hoat_chat: p.drugDetail?.ingredients || '',
            ham_luong: p.drugDetail?.concentration || '',
            dang_bao_che: p.drugDetail?.dosageForm || '',
            quy_cach_dong_goi: p.drugDetail?.packaging || '',
            don_vi_tinh: p.unit,
            gia_ban: p.price,
            cong_ty: p.drugDetail?.manufacturer || '',
            nuoc_san_xuat: p.countryId === 'VN' ? 'Việt Nam' : 'Nước ngoài'
        }));

        const chunkSize = 100;
        let successCount = 0;
        
        for (let i = 0; i < productsToSync.length; i += chunkSize) {
            const chunk = productsToSync.slice(i, i + chunkSize);
            const { error } = await supabase.from('products').insert(chunk);
            if (!error) successCount += chunk.length;
        }
        
        alert(`Đã đồng bộ ${successCount} sản phẩm mẫu lên Cloud!`);
        refreshProducts(); 
    } catch (e: any) {
        alert("Lỗi: " + e.message);
    } finally {
        setIsSyncing(false);
    }
  };

  // Notifications logic
  const notifications = useMemo(() => {
    const alerts: string[] = [];
    const todayStr = new Date().toLocaleDateString('vi-VN');

    // New Orders
    data.salesInvoices
        .filter(inv => inv.date.includes(todayStr))
        .slice(0, 3)
        .forEach(inv => alerts.push(`ĐƠN HÀNG MỚI: #${inv.id} - ${inv.totalAmount.toLocaleString()}₫`));
    
    // Low stock / Expiry
    data.batches.forEach(b => {
       if (b.currentStock < 10) {
          const prod = data.products.find(p => p.id === b.productId);
          if (prod) alerts.push(`CẢNH BÁO: ${prod.name} sắp hết hàng (${b.currentStock})`);
       }
    });

    return alerts;
  }, [data.batches, data.products, data.salesInvoices]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLogin = (user: Employee) => { setCurrentUser(user); setIsAuthenticated(true); };
  const handleLogout = () => {
    window.location.reload();
  };
  const handleRegister = async (newEmployee: Employee) => {
    setData(prev => ({ ...prev, employees: [...prev.employees, newEmployee] }));
    if (isSupabaseConfigured) {
      await supabase.from('employees').insert(newEmployee);
    }
  };

  // --- RENDER ---

  if (appLoading) {
     return (
        <div className="min-h-screen bg-[#0047AB] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFD700] rounded-full blur-[150px] opacity-20 animate-pulse"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 border-4 border-[#FFD700]/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-4 border-t-[#FFD700] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                        <Database className="text-white" size={32} />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white font-serif tracking-wide mb-2">BabyPharma</h1>
                <p className="text-blue-200 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Đang khởi tạo kho hàng...
                </p>
            </div>
        </div>
     );
  }

  if (showSupabaseSetup) return <SupabaseSetupInstructions onClose={() => window.location.reload()} />;
  if (!isAuthenticated) return <Auth employees={data.employees} onLogin={handleLogin} onRegister={handleRegister} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'products': return <ProductList data={data} setData={setData} />;
      case 'sales': return <SalesPOS data={data} setData={setData} />;
      case 'inventory': return <Inventory data={data} setData={setData} />;
      case 'customers': return <CustomerList data={data} setData={setData} />;
      case 'suppliers': return <SupplierList data={data} setData={setData} />;
      case 'employees': return <EmployeeList data={data} setData={setData} />;
      case 'reports': return <Reports data={data} />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} h-screen overflow-hidden`}>
        <TopHeader toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} notifications={notifications} currentUser={(currentUser || {}) as Employee} onLogout={handleLogout} />

        <main className={`flex-1 overflow-y-auto p-6 bg-slate-50 relative mt-16`}>
          <div className="max-w-7xl mx-auto pb-10">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

const AppWrapper = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWrapper;