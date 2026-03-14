
// 1. Nhân viên (Employees)
export enum EmployeeRole {
  PHARMACIST = 'Dược sĩ',
  SALES = 'Bán hàng',
  MANAGER = 'Quản lý',
  WAREHOUSE = 'Nhân viên kho'
}

export interface Employee {
  id: string; // Mã NV
  fullName: string; // Họ tên
  role: EmployeeRole; // Chức vụ
  phone: string; // Số điện thoại
  degree: string; // Bằng cấp
  age: number; // Tuổi NV
  password?: string; // Mật khẩu đăng nhập
}

// 2. Nhà Cung Cấp (Suppliers)
export enum SupplierType {
  DOMESTIC = 'Nội địa',
  IMPORT = 'Nhập khẩu'
}

export interface Supplier {
  id: string; // Mã NCC
  countryId: string; // Mã Quốc gia
  name: string; // Tên NCC
  address: string; // Địa chỉ
  phone: string; // Số điện thoại
  taxId: string; // Mã số thuế
  type: SupplierType; // Loại hình
}

// 3. Khách hàng (Customers)
export interface Customer {
  id: string; // Mã KH
  fullName: string; // Họ tên
  phone: string; // Số điện thoại
  medicalHistory?: string; // Tiền sử bệnh lý (New)
  age: number; // Tuổi tác
  address: string; // Địa chỉ
  relativeInfo?: string; // Nhân thân
  loyaltyPoints: number; // Điểm tích lũy (New)
  lastPurchaseDate?: string; // Ngày mua gần nhất
}

// 10. Quốc gia (Countries)
export interface Country {
  id: string; // Mã Quốc gia
  name: string; // Tên quốc gia
  importTax: number; // Thuế nhập khẩu mặc định (%)
}

// 11. Loại sản phẩm (Product Types)
export interface ProductType {
  id: string; // Mã loại
  name: string; // Tên loại
  note?: string; // Ghi chú
}

// 13. Chi tiết thuốc (Drug Details)
export interface DrugDetail {
  regNumber?: string; // Số đăng ký
  concentration: string; // Nồng độ/Hàm lượng
  ingredients: string; // Hoạt chất
  usage: string; // HDSD
  dosageForm: string; // Dạng bào chế
  packaging: string; // Quy cách đóng gói
  manufacturer: string; // Công ty sản xuất
}

// 12. Sản phẩm (Products)
export interface Product {
  id: string; // Mã SP (STT)
  name: string; // Tên SP
  typeId: string; // Mã loại
  countryId: string; // Mã Quốc gia
  unit: string; // Đơn vị tính
  price: number; // Giá bán
  costPrice: number; // Giá vốn (New - for inventory value)
  vat: number; // Thuế VAT
  isDrug: boolean; // Là thuốc
  drugDetail?: DrugDetail; // Chi tiết thuốc
  // New Fields for Import Logic
  minStock?: number; // Định mức tồn kho tối thiểu (Mặc định 10)
  isImportRequested?: boolean; // Cờ yêu cầu nhập hàng thủ công
}

// 9. Lô hàng (Batches)
export interface Batch {
  id: string; // ID lô
  productId: string; // Mã SP
  mfgBatchNum: string; // Số lô NSX
  expiryDate: string; // Hạn sử dụng
  mfgDate: string; // Ngày sản xuất
  currentStock: number; // Tồn kho hiện tại
}

// 4. Hóa đơn bán hàng (Sales Invoice)
export enum PaymentMethod {
  CASH = 'Tiền mặt',
  TRANSFER = 'Chuyển khoản',
  CARD = 'Thẻ'
}

export interface SalesInvoice {
  id: string; // Mã hóa đơn
  date: string; // Ngày lập
  customerId: string | null; // Mã KH
  customerName: string; // Tên KH
  customerPhone?: string; // SĐT Khách hàng
  employeeId: string; // Mã NV bán
  employeeName: string; // Tên NV bán
  totalAmount: number; // Tổng tiền
  totalTax: number; // Tổng thuế VAT
  totalProfit: number; // Tổng lợi nhuận
  paymentMethod: PaymentMethod; // Hình thức thanh toán
  storeId: string; // Mã cửa hàng
  totalItems: number; // Số lượng hàng
  pointsEarned: number; // Điểm tích được (New)
  pointsRedeemed: number; // Điểm đã dùng (New)
  discountAmount: number; // Số tiền giảm giá từ điểm (New)
}

// 5. Chi tiết hóa đơn (Invoice Details)
export interface InvoiceDetail {
  id: string; // Mã chi tiết HĐ
  invoiceId: string; // Mã hóa đơn
  productId: string; // Mã SP
  quantity: number; // Số lượng
  unitPrice: number; // Đơn giá
  discount: number; // Chiết khấu
  vat: number; // Thuế VAT
}

// 6. Hóa đơn nhập hàng (Import Invoice)
export enum PaymentStatus {
  PAID = 'Đã thanh toán',
  PARTIAL = 'Thanh toán một phần',
  UNPAID = 'Chưa thanh toán'
}

export interface ImportInvoice {
  id: string; // Mã HĐN
  date: string; // Ngày nhập
  supplierId: string; // Mã NCC
  totalAmount: number; // Tổng tiền
  taxRate: number; // Thuế suất
  paymentStatus: PaymentStatus; // Trạng thái thanh toán
}

// 7. Chi tiết phiếu nhập (Import Slip Detail)
export interface ImportDetail {
  id: string; // Mã Phiếu NK
  date: string; // Ngày nhập
  importInvoiceId: string; // Mã HĐN
  employeeId: string; // Mã NV
  productId: string; // Mã SP
  batchId: string; // ID lô
  expiryDate: string; // Hạn sử dụng
  quantity: number; // Số lượng
  importPrice: number; // Giá nhập
}

// 8. Chi tiết phiếu xuất (Export Slip Detail)
export interface ExportDetail {
  id: string; // Mã phiếu XK
  date: string; // Ngày xuất
  reason: string; // Lý do xuất
  employeeId: string; // Mã NV
  batchId: string; // ID lô
  productId: string; // Mã SP
  quantity: number; // Số lượng xuất
}

// New: POS Settings
export interface AppSettings {
  defaultPaymentMethod: PaymentMethod;
  pointValue: number; // 1 Point = ? VND Discount
  earnRate: number;   // ? VND spent = 1 Point
}

// App Data Store
export interface AppData {
  employees: Employee[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  batches: Batch[];
  salesInvoices: SalesInvoice[];
  invoiceDetails: InvoiceDetail[];
  importInvoices: ImportInvoice[];
  importDetails: ImportDetail[];
  countries: Country[];
  productTypes: ProductType[];
  appSettings: AppSettings; // Added Settings
}
