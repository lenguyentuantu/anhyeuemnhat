
import React, { useState, useEffect, useRef } from 'react';
import { AppData, Product, DrugDetail } from '../types';
import { Plus, Search, AlertCircle, Edit2, Trash2, Pill, Package, Tag, Building2, MapPin, ChevronLeft, ChevronRight, CheckCircle2, X, ClipboardList, CheckSquare } from 'lucide-react';
import { db, PaginatedResult } from '../services/Database';

interface ProductListProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const ProductList: React.FC<ProductListProps> = ({ data, setData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State for Query Results
  const [queryResult, setQueryResult] = useState<PaginatedResult<Product>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  // Styles (Sapphire & Gold)
  const inputClassName = "w-full border border-blue-200 bg-blue-50/50 p-3 rounded-xl text-[#0047AB] placeholder-blue-300 font-medium focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] outline-none transition-all shadow-inner";
  const labelClassName = "text-sm font-bold text-[#0047AB] mb-1 block";

  // Empty State for form
  const initialProduct: Partial<Product> = {
    name: '',
    unit: 'Hộp',
    price: 0,
    vat: 0,
    isDrug: false,
    countryId: 'VN',
    typeId: 'T01',
    minStock: 10,
    isImportRequested: false
  };
  const [newProduct, setNewProduct] = useState<Partial<Product>>(initialProduct);
  const [drugDetail, setDrugDetail] = useState<Partial<DrugDetail>>({
    regNumber: '',
    concentration: '',
    ingredients: '',
    usage: '',
    dosageForm: '',
    packaging: '',
    manufacturer: ''
  });

  // Effect to Query Database when filters change
  useEffect(() => {
    setIsLoading(true);
    // Small timeout to debounce search and simulate loading feel
    const timer = setTimeout(() => {
      const result = db.searchProducts(searchTerm, currentPage, 20, activeTypeFilter);
      setQueryResult(result);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, activeTypeFilter, data.products.length, data.products]); 

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return alert("Vui lòng nhập tên và giá");

    const product: Product = {
      id: `SP${Date.now()}`,
      ...newProduct as Product,
      drugDetail: newProduct.isDrug ? drugDetail as DrugDetail : undefined
    };

    const newProductsList = [product, ...data.products];
    const newBatchesList = [...data.batches];
    
    setData(prev => ({
      ...prev,
      products: newProductsList
    }));
    
    db.loadData(newProductsList, newBatchesList);

    setShowForm(false);
    setNewProduct(initialProduct);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= queryResult.totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const toggleImportRequest = (product: Product) => {
     const updatedProducts = data.products.map(p => {
        if (p.id === product.id) {
           return { ...p, isImportRequested: !p.isImportRequested };
        }
        return p;
     });

     setData(prev => ({ ...prev, products: updatedProducts }));
     db.loadData(updatedProducts, data.batches);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTypeFilter]);

  // SKELETON LOADER
  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col h-[280px] animate-pulse">
        <div className="h-4 w-12 bg-slate-200 rounded mb-2"></div>
        <div className="h-6 w-3/4 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-slate-200 rounded mb-4"></div>
        <div className="flex-1 space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded"></div>
            <div className="h-3 w-full bg-slate-100 rounded"></div>
        </div>
        <div className="h-10 w-full bg-slate-100 rounded-xl mt-4"></div>
      </div>
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0047AB] flex items-center gap-2">
            <Pill className="text-[#FFD700]" /> Danh Mục Thuốc & Sản Phẩm
          </h2>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500"/>
            Đang hiển thị từ Database: <span className="font-bold text-slate-800">{queryResult.total.toLocaleString()}</span> mặt hàng
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] hover:shadow-lg text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-blue-900/20"
        >
          <Plus size={20} className="text-[#FFD700]" /> Thêm Mới
        </button>
      </div>

      <div className="sticky top-20 z-20 h-20">
        <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-100 flex items-center gap-2 transition-all duration-500 relative overflow-hidden">
          
          {/* SEARCH INPUT - EXPANDING LOGIC */}
          <div className={`relative transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-full' : 'w-full md:w-64 lg:w-80'}`}>
            <Search 
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearchFocused ? 'text-[#0047AB]' : 'text-slate-400'}`} 
              size={isSearchFocused ? 24 : 20} 
            />
            
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder={isSearchFocused ? "Nhập tên thuốc, hoạt chất, số đăng ký..." : "Tìm kiếm..."}
              className={`w-full pl-12 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0047AB]/20 focus:border-[#0047AB] transition-all duration-300 ease-out 
                ${isSearchFocused 
                  ? 'py-4 text-lg bg-white shadow-xl ring-4 ring-blue-50 border-[#0047AB]' // Focused Styles
                  : 'py-2.5 bg-slate-50 text-sm' // Default Styles
                }`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                if (!searchTerm) setIsSearchFocused(false);
              }}
            />

            {searchTerm && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* FILTERS - HIDE WHEN FOCUSED */}
          <div className={`flex gap-2 overflow-x-auto custom-scrollbar pb-1 transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-0 opacity-0 px-0' : 'flex-1 opacity-100'}`}>
              <button 
                onClick={() => setActiveTypeFilter('ALL')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-sm border ${activeTypeFilter === 'ALL' ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                Tất cả
              </button>
              {data.productTypes.map(type => (
                <button 
                  key={type.id}
                  onClick={() => setActiveTypeFilter(type.id)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-sm border ${activeTypeFilter === type.id ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {type.name}
                </button>
              ))}
          </div>

          {isSearchFocused && (
             <button 
               onMouseDown={(e) => {
                 e.preventDefault(); 
                 setIsSearchFocused(false);
                 searchInputRef.current?.blur();
               }}
               className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 whitespace-nowrap animate-fade-in"
             >
               Hủy
             </button>
          )}

        </div>
      </div>

      {/* Grid Layout for Products */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
           {renderSkeletons()}
        </div>
      ) : queryResult.data.length === 0 ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-300">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
             <AlertCircle size={40} className="text-slate-300" />
           </div>
           <h3 className="text-lg font-bold text-slate-600">Không tìm thấy sản phẩm</h3>
           <p>Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <>
          {/* UPDATED GRID: Use minmax for robust responsive layout. */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
            {queryResult.data.map(product => {
              const stock = db.getStock(product.id);
              const countryName = data.countries.find(c => c.id === product.countryId)?.name || product.countryId;

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col group h-full relative">
                  
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-50 bg-gradient-to-br from-white to-slate-50 relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1 rounded uppercase tracking-wider">{product.id}</span>
                      {product.isDrug && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                          <Pill size={10} /> THUỐC
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2 h-[3.2rem]" title={product.name}>
                      {product.name}
                    </h3>
                    {product.drugDetail && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic">
                        {product.drugDetail.ingredients}
                      </p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#0047AB]">
                        {product.price.toLocaleString()} <span className="text-sm font-normal text-slate-400">₫</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        /{product.unit}
                      </span>
                    </div>

                    {product.drugDetail && (
                      <div className="space-y-2 pt-2 border-t border-slate-50">
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <Tag size={14} className="mt-0.5 text-blue-400 shrink-0" />
                          <span className="line-clamp-1" title={product.drugDetail.dosageForm}>{product.drugDetail.dosageForm || '---'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <Package size={14} className="mt-0.5 text-orange-400 shrink-0" />
                          <span className="line-clamp-1" title={product.drugDetail.packaging}>{product.drugDetail.packaging || '---'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <Building2 size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                          <span className="line-clamp-1" title={product.drugDetail.manufacturer}>{product.drugDetail.manufacturer || '---'}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-slate-400 pt-1">
                      <MapPin size={12} /> {countryName}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className={`text-xs font-bold flex items-center gap-1 ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      Tồn: {stock.toLocaleString()}
                    </div>
                    <div className="flex gap-2 transition-opacity">
                      {/* Request Import Button */}
                      <button 
                        onClick={() => toggleImportRequest(product)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          product.isImportRequested 
                          ? 'text-white bg-blue-600 hover:bg-blue-700' 
                          : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={product.isImportRequested ? "Đã yêu cầu nhập hàng" : "Yêu cầu nhập hàng"}
                      >
                         {product.isImportRequested ? <CheckSquare size={16}/> : <ClipboardList size={16} />}
                      </button>

                      <button className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {queryResult.totalPages > 1 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500">
                Trang <span className="font-bold text-slate-800">{currentPage}</span> / <span className="font-bold text-slate-800">{queryResult.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-1">
                   {Array.from({ length: Math.min(5, queryResult.totalPages) }, (_, i) => {
                      let p = i + 1;
                      if (currentPage > 3 && queryResult.totalPages > 5) p = currentPage - 2 + i;
                      // Ensure page doesn't exceed total
                      if (p > queryResult.totalPages) return null;
                      
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                            currentPage === p 
                              ? 'bg-[#0047AB] text-white shadow-lg shadow-blue-900/20' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      );
                   })}
                </div>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === queryResult.totalPages}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0047AB]/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-white/50 animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-[#0047AB] flex items-center gap-2">
                    <Pill size={24} className="text-[#FFD700]"/> Thêm Sản Phẩm Mới
                </h3>
                <p className="text-xs text-slate-500">Nhập thông tin chi tiết thuốc hoặc hàng hóa</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">✕</button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Form Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className={labelClassName}>Tên sản phẩm <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className={inputClassName}
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="VD: Panadol Extra"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClassName}>Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    className={inputClassName}
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  />
                </div>
              </div>

              {/* Min Stock Setting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className={labelClassName}>Định mức tồn kho (Cảnh báo khi dưới mức này)</label>
                  <input 
                    type="number" 
                    className={inputClassName}
                    value={newProduct.minStock}
                    onChange={e => setNewProduct({...newProduct, minStock: Number(e.target.value)})}
                  />
                </div>
              </div>

              {/* Is Drug Toggle */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isDrug" 
                  checked={newProduct.isDrug}
                  onChange={e => setNewProduct({...newProduct, isDrug: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDrug" className="font-semibold text-[#0047AB] cursor-pointer">
                  Đây là thuốc (Kích hoạt nhập liệu chi tiết: Dược chất, Hàm lượng...)
                </label>
              </div>

              {/* Conditional Drug Details */}
              {newProduct.isDrug && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 border border-blue-100 rounded-xl bg-blue-50/30">
                   <div className="md:col-span-2 text-sm font-bold text-[#0047AB] uppercase tracking-wider mb-1">Thông tin dược lý</div>
                   <div className="space-y-1">
                      <label className={labelClassName}>Hoạt chất chính</label>
                      <input 
                        type="text" 
                        className={inputClassName}
                        value={drugDetail.ingredients}
                        onChange={e => setDrugDetail({...drugDetail, ingredients: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className={labelClassName}>Hàm lượng</label>
                      <input 
                        type="text" 
                        className={inputClassName}
                        value={drugDetail.concentration}
                        onChange={e => setDrugDetail({...drugDetail, concentration: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className={labelClassName}>Dạng bào chế</label>
                      <input 
                        type="text" 
                        className={inputClassName}
                        value={drugDetail.dosageForm}
                        onChange={e => setDrugDetail({...drugDetail, dosageForm: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className={labelClassName}>Quy cách</label>
                      <input 
                        type="text" 
                        className={inputClassName}
                        value={drugDetail.packaging}
                        onChange={e => setDrugDetail({...drugDetail, packaging: e.target.value})}
                      />
                   </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Hủy bỏ</button>
                <button onClick={handleAddProduct} className="px-6 py-2.5 bg-gradient-to-r from-[#0047AB] to-[#1E5FD6] text-white font-bold rounded-xl hover:shadow-lg shadow-blue-900/20 transition-all transform active:scale-95">
                  Lưu Sản Phẩm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
