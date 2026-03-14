
import React from 'react';
import { SalesInvoice, InvoiceDetail, AppData } from '../types';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  invoice: SalesInvoice;
  details: InvoiceDetail[];
  data: AppData;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, details, data, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  // Mock Bank Data for VietQR
  const BANK_ID = 'MB'; // MB Bank
  const ACCOUNT_NO = '0901234567'; // Mock account
  const ACCOUNT_NAME = 'NHATHUOC BABYPHARMA';
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${invoice.totalAmount}&addInfo=${invoice.id}&accountName=${ACCOUNT_NAME}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white print:absolute print:inset-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:w-full print:max-w-none print:h-auto print:rounded-none">
        
        {/* Header - Hidden on Print */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500"/>
            Thanh Toán Thành Công
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible custom-scrollbar">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wide mb-1">Nhà Thuốc BabyPharma</h1>
            <p className="text-xs text-slate-500">123 Đường Sức Khỏe, Q.1, TP.HCM</p>
            <p className="text-xs text-slate-500">Hotline: 090.123.4567</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 text-sm">
             <div className="flex justify-between mb-1">
               <span className="text-slate-500">Ngày:</span>
               <span className="font-medium">{invoice.date}</span>
             </div>
             <div className="flex justify-between mb-1">
               <span className="text-slate-500">Số HĐ:</span>
               <span className="font-mono font-bold">{invoice.id}</span>
             </div>
             <div className="flex justify-between mb-1">
               <span className="text-slate-500">Thu ngân:</span>
               <span>{invoice.employeeName}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Khách hàng:</span>
               <span>{invoice.customerName}</span>
             </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold">Tên hàng</th>
                <th className="text-center py-2 font-semibold w-12">SL</th>
                <th className="text-right py-2 font-semibold">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item) => {
                 const prod = data.products.find(p => p.id === item.productId);
                 return (
                  <tr key={item.id} className="border-b border-slate-100 border-dashed">
                    <td className="py-2 pr-2 align-top">
                      <div className="font-medium">{prod?.name}</div>
                      <div className="text-[10px] text-slate-400">{prod?.unit}</div>
                    </td>
                    <td className="py-2 text-center align-top">{item.quantity}</td>
                    <td className="py-2 text-right align-top">{ (item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                 )
              })}
            </tbody>
          </table>

          <div className="space-y-1 text-sm border-t border-slate-800 pt-3">
            <div className="flex justify-between">
               <span className="font-medium">Tổng tiền hàng:</span>
               <span>{(invoice.totalAmount + invoice.discountAmount).toLocaleString()} ₫</span>
            </div>
            {invoice.discountAmount > 0 && (
               <div className="flex justify-between text-slate-500 italic">
                  <span>Chiết khấu (Điểm):</span>
                  <span>-{invoice.discountAmount.toLocaleString()} ₫</span>
               </div>
            )}
            <div className="flex justify-between text-lg font-bold mt-2">
               <span>THANH TOÁN:</span>
               <span>{invoice.totalAmount.toLocaleString()} ₫</span>
            </div>
             {/* VAT Summary */}
             <div className="text-[10px] text-center text-slate-400 mt-2">
               (Giá đã bao gồm thuế VAT: {invoice.totalTax.toLocaleString()} ₫)
             </div>
          </div>
          
          {/* QR Code Section */}
          <div className="mt-6 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 print:border-none print:bg-transparent">
             <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Quét mã thanh toán</p>
             <img src={qrUrl} alt="VietQR" className="w-32 h-32 mix-blend-multiply" />
             <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
               <span>Powered by</span> 
               <span className="font-bold text-blue-600">VietQR</span>
             </div>
          </div>

          <div className="text-center mt-6 text-xs text-slate-500 italic">
             Cảm ơn quý khách và hẹn gặp lại!<br/>
             Giữ hóa đơn để đổi trả trong 3 ngày.
          </div>
        </div>

        {/* Footer Actions - Hidden on Print */}
        <div className="p-4 border-t border-slate-100 flex gap-3 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-[#002366] text-white py-3 rounded-xl font-bold hover:bg-[#0F52BA] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Printer size={18} /> In Hóa Đơn
          </button>
           <button 
            onClick={onClose}
            className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
