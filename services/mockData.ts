
import { 
  AppData, Employee, EmployeeRole, Product, Supplier, SupplierType, 
  Customer, Batch, SalesInvoice, PaymentMethod, Country, ProductType,
  DrugDetail, InvoiceDetail
} from '../types';
import { db } from './Database';

// --- DATA GENERATION HELPERS ---

// Full CSV Content - CRITICAL ITEMS MOVED TO TOP
const csvContent = `ten_thuoc,hoat_chat,ham_luong,dang_bao_che,quy_cach_dong_goi,don_vi_tinh,gia_ban,cong_ty,nuoc_san_xuat
Que thử thai Quickstick,Kháng thể HCG,N/A,Que thử,Hộp 1 cái + cốc,Hộp,17500,Công ty PHARMACITY,Mỹ
Bao cao su Durex Fetherlite,Latex cao su thiên nhiên,Siêu mỏng 52mm,Bao cao su,Hộp 3 cái,Hộp,65000,Reckitt Benckiser Healthcare,Thái Lan
Bao cao su Durex Performa,Latex + Benzocaine 5%,Kéo dài thời gian,Bao cao su,Hộp 12 cái,Hộp,230000,Reckitt Benckiser Healthcare,Thái Lan
Que thử thai Chip-Chips,Kháng thể kháng HCG,Độ nhạy 25mlU/ml,Que thử,Hộp 1 que,Hộp,10000,Công ty Cổ phần Tanaphar,Việt Nam
Bao cao su Sagami Original 0.02,Polyurethane,Siêu mỏng 0.02mm,Bao cao su,Hộp 1 cái,Hộp,50000,Sagami Rubber Industries,Nhật Bản
Hapacol 650,Paracetamol,650mg,Viên nén sủi,Hộp 5 vỉ x 4 viên,Viên,1500,Công ty Cổ phần Dược Hậu Giang,Việt Nam
Augmentin 625mg,Amoxicillin + Acid clavulanic,625mg,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,14500,GlaxoSmithKline (Ireland) Ltd.,Ireland
Amlodipine Stella 5mg,Amlodipine,5mg,Viên nén,Hộp 3 vỉ x 10 viên,Viên,650,Công ty TNHH Liên doanh Stellapharm,Việt Nam
Panadol Extra,Paracetamol + Caffeine,500mg/65mg,Viên nén,Hộp 15 vỉ x 12 viên,Viên,1200,Sanofi-Synthelabo Việt Nam,Việt Nam
Enervon-C,Vitamin C + Vitamin B complex,Nhiều thành phần,Viên bao đường,Chai 30 viên,Viên,2500,Công ty TNHH United International Pharma,Việt Nam
Zinnat 500mg,Cefuroxime,500mg,Viên nén bao phim,Hộp 1 vỉ x 10 viên,Viên,24000,Glaxo Operations UK Ltd,Anh
Vastarel MR,Trimetazidine,35mg,Viên nén giải phóng biến đổi,Hộp 2 vỉ x 30 viên,Viên,3200,Les Laboratoires Servier Industrie,Pháp
Tanganil 500mg,Acetyl-DL-Leucine,500mg,Viên nén,Hộp 3 vỉ x 10 viên,Viên,5800,Pierre Fabre Medicament Production,Pháp
Klamentin 875/125,Amoxicillin + Acid clavulanic,875mg/125mg,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,11000,Công ty Cổ phần Dược Hậu Giang,Việt Nam
Efferalgan 500mg,Paracetamol,500mg,Viên nén sủi,Hộp 4 vỉ x 4 viên,Viên,3500,UPSA SAS,Pháp
Glucophage 850mg,Metformin,850mg,Viên nén bao phim,Hộp 2 vỉ x 15 viên,Viên,2100,Merck S.L.,Tây Ban Nha
Lipitor 20mg,Atorvastatin,20mg,Viên nén bao phim,Hộp 3 vỉ x 10 viên,Viên,18500,Pfizer Manufacturing Deutschland GmbH,Đức
Berocca Performance,Vitamin B complex + C + Ca + Mg + Zn,Nhiều thành phần,Viên nén sủi,Hộp 10 viên,Viên,7500,Delpharm Gaillard,Pháp
Nexium mups 40mg,Esomeprazole,40mg,Viên nén kháng dịch vị,Hộp 2 vỉ x 7 viên,Viên,22000,AstraZeneca AB,Thụy Điển
Decolgen Forte,Paracetamol + Chlorpheniramine + Phenylpropanolamine,500mg/2mg/12.5mg,Viên nén,Hộp 25 vỉ x 4 viên,Viên,1000,Công ty TNHH United International Pharma,Việt Nam
Ciprofloxacin 500mg,Ciprofloxacin,500mg,Viên nén bao phim,Hộp 10 vỉ x 10 viên,Viên,850,Công ty Cổ phần Dược phẩm TV.Pharm,Việt Nam
Medrol 16mg,Methylprednisolone,16mg,Viên nén,Hộp 3 vỉ x 10 viên,Viên,4200,Pfizer Italia S.r.l.,Ý
Plavix 75mg,Clopidogrel,75mg,Viên nén bao phim,Hộp 2 vỉ x 14 viên,Viên,19800,Sanofi Winthrop Industrie,Pháp
Boganic,Cao Actiso + Cao Rau đắng đất + Cao Bìm bìm,Nhiều thành phần,Viên nang mềm,Hộp 5 vỉ x 10 viên,Viên,2200,Công ty Cổ phần Traphaco,Việt Nam
Voltaren 50mg,Diclofenac,50mg,Viên nén bao phim tan trong ruột,Hộp 10 vỉ x 10 viên,Viên,3500,Novartis Pharma S.p.A.,Ý
Augmentin 625mg,Amoxicillin + Acid clavulanic,500mg + 125mg,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,14850,GlaxoSmithKline Pte Ltd,Anh
Klacid Forte,Clarithromycin,500mg,Viên nén bao phim,Hộp 1 vỉ x 14 viên,Viên,24500,Abbott Laboratories,Ý
Diamicron MR,Gliclazide,60mg,Viên nén giải phóng có kiểm soát,Hộp 2 vỉ x 15 viên,Viên,5620,Les Laboratoires Servier,Pháp
Amlor,Amlodipine besylate,5mg,Viên nang,Hộp 3 vỉ x 10 viên,Viên,10500,Pfizer Limited,Úc
Effer-Paracetamol 500mg,Paracetamol,500mg,Viên nén sủi,Hộp 4 vỉ x 4 viên,Viên,1650,Công ty Cổ phần Hóa - Dược phẩm Mekophar,Việt Nam
Zinnat Tablets 250mg,Cefuroxim axetil,250mg,Viên nén bao phim,Hộp 1 vỉ x 10 viên,Viên,14200,Glaxo Operations UK Limited,Anh
Plavix,Clopidogrel,75mg,Viên nén bao phim,Hộp 2 vỉ x 14 viên,Viên,18900,Sanofi-Aventis,Pháp
Crestor,Rosuvastatin calci,10mg,Viên nén bao phim,Hộp 2 vỉ x 14 viên,Viên,14350,AstraZeneca UK Limited,Anh
Nexium mups,Esomeprazol,20mg,Viên nén kháng dịch dạ dày,Hộp 2 vỉ x 7 viên,Viên,19500,AstraZeneca AB,Thụy Điển
Alpha Choay,Alphachymotrypsin,21 microkatal,Viên nén,Hộp 2 vỉ x 15 viên,Viên,1250,Công ty Cổ phần Dược phẩm Sanofi - Synthelabo Việt Nam,Việt Nam
Hapacol 650,Paracetamol,650mg,Viên nén,Hộp 10 vỉ x 10 viên,Viên,900,Công ty Cổ phần Dược Hậu Giang,Việt Nam
Enervon-C,Vitamin C + Vitamin nhóm B,"500mg + (B1, B2, B3, B5, B6, B12)",Viên nén bao phim,Hộp 10 vỉ x 10 viên,Viên,2200,Công ty TNHH United International Pharma,Việt Nam
Ameflu Daytime,Paracetamol + Guaifenesin + Phenylephrine + Dextromethorphan,500mg + 200mg + 10mg + 15mg,Viên nén bao phim,Hộp 10 vỉ x 10 viên,Viên,2100,Công ty Cổ phần Dược phẩm OPV,Việt Nam
Imexime 200,Cefixim,200mg,Viên nang cứng,Hộp 2 vỉ x 10 viên,Viên,6400,Công ty Cổ phần Dược phẩm Imexpharm,Việt Nam
Vasco 10,Atorvastatin,10mg,Viên nén bao phim,Hộp 3 vỉ x 10 viên,Viên,3200,Công ty Cổ phần Xuất nhập khẩu Y tế Domesco,Việt Nam
Tatanol 500mg,Paracetamol,500mg,Viên nén,Hộp 10 vỉ x 10 viên,Viên,480,Công ty Cổ phần Pymepharco,Việt Nam
Cefaklor 250,Cefaclor,250mg,Viên nang,Hộp 10 vỉ x 10 viên,Viên,4950,Công ty Cổ phần Dược phẩm Pharmadic,Việt Nam
Becozyme,Vitamin B complex,2ml,Dung dịch tiêm,Hộp 12 ống x 2ml,Ống,12800,"Bayer South East Asia Pte., Ltd",Pháp
Coveram 5mg/5mg,Perindopril arginine + Amlodipine,5mg + 5mg,Viên nén,Hộp 1 lọ 30 viên,Viên,10800,Les Laboratoires Servier,Ireland
Glucophage 850mg,Metformin hydrochloride,850mg,Viên nén bao phim,Hộp 2 vỉ x 15 viên,Viên,4350,Merck Sante s.a.s,Pháp
Augmentin 625mg,Amoxicillin (dưới dạng Amoxicillin trihydrat) 500mg + Acid clavulanic (dưới dạng Kali clavulanat) 125mg,625mg,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,16500,GlaxoSmithKline Pte Ltd,Pháp
Efferalgan Codeine,Paracetamol + Codein phosphat,500mg + 30mg,Viên nén sủi bọt,Hộp 10 vỉ x 4 viên,Viên,10200,Bristol-Myers Squibb,Pháp
Amlor,Amlodipin (dưới dạng amlodipin besilat),5mg,Viên nang,Hộp 3 vỉ x 10 viên,Viên,13800,Pfizer Thailand Ltd.,Úc
Enervon-C,Vitamin C + Vitamin B1 + Vitamin B2 + Vitamin B6 + Vitamin B12 + Niacinamide + Calcium pantothenate,500mg + 50mg + 20mg + 5mg + 5mcg + 50mg + 20mg,Viên nén bao đường,Hộp 10 vỉ x 10 viên,Viên,1500,Công ty TNHH United Pharma Việt Nam,Việt Nam
Klacid Forte,Clarithromycin,500mg,Viên nén bao phim,Hộp 1 vỉ x 14 viên,Viên,32500,AbbVie S.r.l,Ý
Daflon 500mg,"Phân đoạn flavonoid vi hạt tinh chế (Diosmin 450mg, Hesperidin 50mg)",500mg,Viên nén bao phim,Hộp 4 vỉ x 15 viên,Viên,3850,Les Laboratoires Servier Industrie,Pháp
Nexium mups 20mg,Esomeprazol (dưới dạng Esomeprazol magnesium trihydrate),20mg,Viên nén bao phim tan trong ruột,Hộp 2 vỉ x 7 viên,Viên,23900,AstraZeneca AB,Thụy Điển
Vastarel MR,Trimetazidin dihydroclorid,35mg,Viên nén giải phóng biến đổi,Hộp 2 vỉ x 30 viên,Viên,3150,Les Laboratoires Servier Industrie,Pháp
Zinnat Tablets 500mg,Cefuroxim (dưới dạng Cefuroxim axetil),500mg,Viên nén bao phim,Hộp 1 vỉ x 10 viên,Viên,26800,Glaxo Operations UK Limited,Anh
Lipitor,Atorvastatin (dưới dạng Atorvastatin calcium),10mg,Viên nén bao phim,Hộp 3 vỉ x 10 viên,Viên,19200,Pfizer Manufacturing Deutschland GmbH,Đức
Panadol Extra,Paracetamol + Caffeine,500mg + 65mg,Viên nén,Hộp 15 vỉ x 12 viên,Viên,1250,Công ty TNHH Sanofi - Aventis Việt Nam,Việt Nam
Neurobion,Vitamin B1 + Vitamin B6 + Vitamin B12,100mg + 200mg + 200mcg,Viên nén bao đường,Hộp 5 vỉ x 10 viên,Viên,2850,Merck Ltd.,Thái Lan
Plavix,Clopidogrel (dưới dạng Clopidogrel hydrogen sulphate),75mg,Viên nén bao phim,Hộp 2 vỉ x 14 viên,Viên,18500,Sanofi Winthrop Industrie,Pháp
Hapacol 250 Flu,Paracetamol + Chlorpheniramin maleat,250mg + 2mg,Thuốc bột sủi bọt,"Hộp 24 gói x 1,5g",Gói,1600,Công ty Cổ phần Dược Hậu Giang,Việt Nam
Imexime 200,Cefixim (dưới dạng Cefixim trihydrat),200mg,Viên nang cứng,Hộp 2 vỉ x 10 viên,Viên,4800,Công ty Cổ phần Dược phẩm Imexpharm,Việt Nam
Aspirin 81mg,Acid acetylsalicylic,81mg,Viên nén bao phim tan trong ruột,Hộp 10 vỉ x 10 viên,Viên,450,Công ty Cổ phần Dược phẩm TV.Pharm,Việt Nam
Glucophage 500mg,Metformin hydroclorid,500mg,Viên nén bao phim,Hộp 5 vỉ x 10 viên,Viên,1850,Merck Santé s.a.s,Pháp
Gaviscon Forte,Natri alginat + Natri bicarbonat + Calci carbonat,500mg + 267mg + 160mg,Hỗn dịch uống,Hộp 24 gói x 10ml,Gói,7200,Reckitt Benckiser Healthcare (UK) Limited,Anh
Decolgen Forte,Paracetamol + Phenylpropanolamin HCl + Chlorpheniramin maleat,500mg + 25mg + 2mg,Viên nén,Hộp 25 vỉ x 4 viên,Viên,1150,Công ty TNHH United Pharma Việt Nam,Việt Nam
Becozyme,Vitamin B1 + Vitamin B2 + Vitamin B5 + Vitamin B6 + Vitamin PP,10mg + 4mg + 6mg + 4mg + 40mg (trong 2ml),Dung dịch tiêm,Hộp 12 ống x 2ml,Ống,8800,Cenexi SAS,Pháp
Augmentin 625mg,"Amoxicillin (dưới dạng Amoxicillin trihydrat) 500mg;"" Acid clavulanic (dưới dạng Kali clavulanat) 125mg""",625mg,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,16250,GlaxoSmithKline (Ireland) Limited,Pháp
Efferalgan,Paracetamol,500mg,Viên sủi,Hộp 4 vỉ x 4 viên,Viên,2950,Bristol-Myers Squibb,Pháp
Amlor,Amlodipine (dưới dạng Amlodipine besilate),5mg,Viên nang cứng,Hộp 3 vỉ x 10 viên,Viên,10500,"Pfizer Australia Pty., Ltd.",Úc
Crestor,Rosuvastatin (dưới dạng Rosuvastatin calci),10mg,Viên nén bao phim,Hộp 2 vỉ x 14 viên,Viên,15800,AstraZeneca UK Limited,Anh
Hapacol 650,Paracetamol,650mg,Viên nén,Hộp 10 vỉ x 10 viên,Viên,1250,Công ty Cổ phần Dược Hậu Giang,Việt Nam
Klamentin 1g,"Amoxicillin 875mg;"" Acid clavulanic 125mg""",1g,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,14200,Công ty Cổ phần Dược Hậu Giang,Việt Nam
Enap 5mg,Enalapril maleat,5mg,Viên nén,Hộp 2 vỉ x 10 viên,Viên,2150,"KRKA, D.D., Novo Mesto",Slovenia
Vitamin C Mekophar,Acid ascorbic,500mg,Viên nén,Hộp 10 vỉ x 10 viên,Viên,450,Công ty Cổ phần hóa - Dược phẩm Mekophar,Việt Nam
Nexium mups,Esomeprazole (dưới dạng Esomeprazole magnesium trihydrate),20mg,Viên nén bao phim,Hộp 2 vỉ x 7 viên,Viên,19200,AstraZeneca AB,Thụy Điển
Zinnat 500mg,Cefuroxime (dưới dạng Cefuroxime axetil),500mg,Viên nén bao phim,Hộp 1 vỉ x 10 viên,Viên,24800,Glaxo Operations UK Ltd.,Anh
Panadol Extra,"Paracetamol 500mg;"" Caffeine 65mg""",565mg,Viên nén bao phim,Hộp 15 vỉ x 12 viên,Viên,1350,Công ty TNHH Sanofi-Aventis Việt Nam,Việt Nam
Tanganil 500mg,Acetylleucin,500mg,Viên nén,Hộp 3 vỉ x 10 viên,Viên,5800,Pierre Fabre Medicament Production,Pháp
Vastarel MR,Trimetazidin dihydroclorid,35mg,Viên nén tác dụng kéo dài,Hộp 2 vỉ x 30 viên,Viên,3150,Les Laboratoires Servier,Pháp
Diamicron MR,Gliclazide,60mg,Viên nén giải phóng có kiểm soát,Hộp 2 vỉ x 15 viên,Viên,5200,Les Laboratoires Servier,Pháp
Glucophage,Metformin hydroclorid,850mg,Viên nén bao phim,Hộp 2 vỉ x 15 viên,Viên,2800,Merck Sante S.A.S,Pháp
Fugacar,Mebendazol,500mg,Viên nén nhai,Hộp 1 vỉ x 1 viên,Viên,18500,Công ty TNHH OLIC (Thailand),Thái Lan
Telfast BD,Fexofenadin hydroclorid,60mg,Viên nén bao phim,Hộp 1 vỉ x 10 viên,Viên,4200,Công ty Cổ phần Dược phẩm Sanofi-Synthelabo Việt Nam,Việt Nam
Mobic,Meloxicam,"7,5mg",Viên nén,Hộp 2 vỉ x 10 viên,Viên,9800,"Boehringer Ingelheim Pharma GmbH & Co., KG",Đức
Voltaren,Diclofenac natri,50mg,Viên nén bao tan trong ruột,Hộp 10 vỉ x 10 viên,Viên,4100,Novartis Pharma Services AG,Thụy Sỹ
Berberin 10mg,Berberin clorid,10mg,Viên nén,Lọ 100 viên,Viên,180,Công ty Cổ phần Dược phẩm OPC,Việt Nam
`;

// Helper Functions
export const getCountryId = (name: string): string => {
  if (!name) return 'OTHER';
  const cleanName = name.trim();
  const map: {[key: string]: string} = {
    'Việt Nam': 'VN', 'Pháp': 'FR', 'Mỹ': 'US', 'Đức': 'DE', 
    'Anh': 'UK', 'Anh Quốc': 'UK', 'Ý': 'IT', 'Italy': 'IT', 'Thụy Điển': 'SE', 'Thụy Sĩ': 'CH', 'Thụy Sỹ': 'CH',
    'Ireland': 'IE', 'Ai-len': 'IE', 'Tây Ban Nha': 'ES', 'Ấn Độ': 'IN', 'Thái Lan': 'TH',
    'Hàn Quốc': 'KR', 'Nhật Bản': 'JP', 'Hungary': 'HU', 'Slovenia': 'SI',
    'Australia': 'AU', 'Úc': 'AU', 'Malaysia': 'MY', 'Indonesia': 'ID',
    'Ba Lan': 'PL', 'Thổ Nhĩ Kỳ': 'TR', 'Hy Lạp': 'GR', 'Áo': 'AT',
    'Na Uy': 'NO', 'Bỉ': 'BE', 'Singapore': 'SG', 'Hà Lan': 'NL',
    'Canada': 'CA', 'Đan Mạch': 'DK', 'Puerto Rico': 'PR'
  };
  return map[cleanName] || 'OTHER';
};

export const productTypes: ProductType[] = [
    { id: 'T01', name: 'Thuốc kháng sinh' },
    { id: 'T02', name: 'Thuốc giảm đau, hạ sốt' },
    { id: 'T03', name: 'Vitamin & Khoáng chất' },
    { id: 'T04', name: 'Tim mạch & Huyết áp' },
    { id: 'T05', name: 'Tiêu hóa & Dạ dày' },
    { id: 'T06', name: 'Cơ xương khớp' },
    { id: 'T07', name: 'Hô hấp & Dị ứng' },
    { id: 'T08', name: 'Khác' },
    { id: 'T09', name: 'Vật tư y tế & Sức khỏe' }
];

export const determineType = (name: string, ingredient: string): string => {
    const text = (name + " " + ingredient).toLowerCase();
    if (text.includes('que thử') || text.includes('bao cao su') || text.includes('durex') || text.includes('quickstick') || text.includes('sagami')) return 'T09';
    if (text.includes('kháng sinh') || text.includes('cef') || text.includes('amoxicillin') || text.includes('augmentin') || text.includes('zinnat') || text.includes('klamentin') || text.includes('cipro') || text.includes('levo') || text.includes('azi')) return 'T01';
    if (text.includes('paracetamol') || text.includes('ibuprofen') || text.includes('aspirin') || text.includes('giảm đau') || text.includes('hapacol') || text.includes('efferalgan') || text.includes('panadol')) return 'T02';
    if (text.includes('vitamin') || text.includes('bổ') || text.includes('sắt') || text.includes('calci') || text.includes('kẽm') || text.includes('magne')) return 'T03';
    if (text.includes('huyết áp') || text.includes('tim') || text.includes('amlodipin') || text.includes('losartan') || text.includes('atorvastatin') || text.includes('concor') || text.includes('coveram')) return 'T04';
    if (text.includes('dạ dày') || text.includes('tiêu hóa') || text.includes('men') || text.includes('nexium') || text.includes('losec') || text.includes('gaviscon') || text.includes('motilium')) return 'T05';
    if (text.includes('khớp') || text.includes('xương') || text.includes('glucosamin') || text.includes('mobic') || text.includes('voltaren')) return 'T06';
    if (text.includes('ho') || text.includes('dị ứng') || text.includes('mũi') || text.includes('telfast') || text.includes('salbutamol') || text.includes('fexofenadin')) return 'T07';
    return 'T08';
};

const parseCSVAndGenerateData = () => {
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0 && !line.startsWith('ten_thuoc'));
    const products: Product[] = [];
    const suppliersMap = new Map<string, Supplier>();
    const countriesMap = new Map<string, Country>();
    const batches: Batch[] = [];

    // DATA DUPLICATION LOGIC TO HIT 1000+ ITEMS
    const TARGET_COUNT = 1200;
    
    let loopCount = 0;

    while (products.length < TARGET_COUNT) {
      loopCount++;
      for (let i = 0; i < lines.length; i++) {
          if (products.length >= TARGET_COUNT) break;

          const line = lines[i].trim();
          
          // Simple CSV split by comma, respecting quotes
          const parts: string[] = [];
          let inQuotes = false;
          let currentValue = '';
          for (const char of line) {
              if (char === '"') {
                  inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                  parts.push(currentValue);
                  currentValue = '';
              } else {
                  currentValue += char;
              }
          }
          parts.push(currentValue);

          if (parts.length < 9) continue;

          const baseName = parts[0]?.trim() || 'Unknown';
          const name = loopCount === 1 ? baseName : `${baseName} (Lô ${loopCount})`;
          
          const ingredient = parts[1]?.trim() || '';
          const concentration = parts[2]?.trim() || '';
          const form = parts[3]?.trim() || '';
          const packaging = parts[4]?.trim() || '';
          const unit = parts[5]?.trim() || 'Hộp';
          const price = parseInt(parts[6]?.replace(/[^0-9]/g, '') || '0');
          const company = parts[7]?.trim().replace(/^"|"$/g, '') || 'Unknown Pharma';
          const countryName = parts[8]?.trim() || 'Việt Nam';

          // 1. Process Country
          const countryId = getCountryId(countryName);
          if (!countriesMap.has(countryId)) {
              countriesMap.set(countryId, {
                  id: countryId,
                  name: countryName,
                  importTax: countryId === 'VN' ? 0 : 10
              });
          }

          // 2. Process Supplier
          if (!suppliersMap.has(company)) {
              const isDomestic = countryId === 'VN';
              const randomDist = ['Quận 1', 'Quận 3', 'Quận Tân Bình', 'TP. Thủ Đức', 'Quận Bình Thạnh'][Math.floor(Math.random() * 5)];
              const randomCity = isDomestic ? `TP. Hồ Chí Minh` : `${countryName}`;
              
              suppliersMap.set(company, {
                  id: `NCC${(suppliersMap.size + 1).toString().padStart(4, '0')}`,
                  name: company,
                  address: isDomestic ? `${Math.floor(Math.random()*100)+1} đường số ${Math.floor(Math.random()*20)+1}, ${randomDist}, ${randomCity}` : `Nhập khẩu trực tiếp từ ${countryName}`,
                  phone: isDomestic ? `028${Math.floor(Math.random()*100000000).toString().slice(0,8)}` : `(+${Math.floor(Math.random()*90)+10}) ${Math.floor(Math.random()*100000000)}`,
                  taxId: `030${Math.floor(Math.random() * 1000000000)}`,
                  countryId: countryId,
                  type: isDomestic ? SupplierType.DOMESTIC : SupplierType.IMPORT
              });
          }

          // 3. Process Product
          const productId = `SP${(products.length + 1).toString().padStart(6, '0')}`;
          const typeId = determineType(baseName, ingredient);
          
          const isManualImportCandidate = i % 50 === 0; 
          
          products.push({
              id: productId,
              name: name,
              typeId: typeId,
              countryId: countryId,
              unit: unit,
              price: price,
              costPrice: Math.round(price * 0.75), // Est 25% profit margin
              vat: 5, // Standard drug VAT
              isDrug: true,
              minStock: 10, // Default minimum stock
              isImportRequested: isManualImportCandidate, 
              drugDetail: {
                  ingredients: ingredient,
                  concentration: concentration,
                  dosageForm: form,
                  packaging: packaging,
                  manufacturer: company,
                  usage: 'Theo chỉ định của bác sĩ',
                  regNumber: `VD-${Math.floor(Math.random()*100000)}-${Math.floor(Math.random()*20)}`
              }
          });

          // 4. Generate Batches (Inventory)
          // Ensure we always have stock for demo
          const batchCount = Math.floor(Math.random() * 2) + 1;
          for(let b=0; b<batchCount; b++) {
              const mfgDate = new Date();
              mfgDate.setMonth(mfgDate.getMonth() - Math.floor(Math.random() * 24));
              
              const expiryDate = new Date(mfgDate);
              const isNearExpiry = Math.random() < 0.05;
              const extraMonths = isNearExpiry ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 18) + 6;
              expiryDate.setMonth(new Date().getMonth() + extraMonths);

              let stock = Math.floor(Math.random() * 150) + 20; // Guarantee at least 20 items

              batches.push({
                  id: `LO-${productId}-${b+1}`,
                  productId: productId,
                  mfgBatchNum: `${Math.floor(Math.random() * 1000000)}`,
                  mfgDate: mfgDate.toISOString().split('T')[0],
                  expiryDate: expiryDate.toISOString().split('T')[0],
                  currentStock: stock
              });
          }
      }
    }

    return {
        products,
        suppliers: Array.from(suppliersMap.values()),
        countries: Array.from(countriesMap.values()),
        batches
    };
};

const generatedData = parseCSVAndGenerateData();

// --- 10 REALISTIC EMPLOYEES ---
const employees: Employee[] = [
    { id: 'NV001', fullName: 'Nguyễn Văn An', role: EmployeeRole.MANAGER, phone: '0909123456', degree: 'Dược sĩ Đại học', age: 35, password: '123' },
    { id: 'NV002', fullName: 'Trần Thị Bích', role: EmployeeRole.PHARMACIST, phone: '0918123456', degree: 'Dược sĩ Đại học', age: 29, password: '123' },
    { id: 'NV003', fullName: 'Lê Hoàng Nam', role: EmployeeRole.PHARMACIST, phone: '0933123456', degree: 'Dược sĩ Cao đẳng', age: 26, password: '123' },
    { id: 'NV004', fullName: 'Phạm Thu Hà', role: EmployeeRole.SALES, phone: '0977123456', degree: 'Trung cấp Dược', age: 24, password: '123' },
    { id: 'NV005', fullName: 'Hoàng Văn Thái', role: EmployeeRole.WAREHOUSE, phone: '0988123456', degree: 'Cao đẳng Kinh tế', age: 30, password: '123' },
    { id: 'NV006', fullName: 'Đỗ Thị Minh', role: EmployeeRole.SALES, phone: '0966123456', degree: 'Trung cấp Dược', age: 22, password: '123' },
    { id: 'NV007', fullName: 'Vũ Thanh Tùng', role: EmployeeRole.PHARMACIST, phone: '0944123456', degree: 'Dược sĩ Đại học', age: 28, password: '123' },
    { id: 'NV008', fullName: 'Ngô Ngọc Lan', role: EmployeeRole.SALES, phone: '0922123456', degree: 'Sinh viên thực tập', age: 21, password: '123' },
    { id: 'NV009', fullName: 'Đặng Văn Hùng', role: EmployeeRole.WAREHOUSE, phone: '0911123456', degree: 'Lao động phổ thông', age: 32, password: '123' },
    { id: 'NV010', fullName: 'Bùi Thị Tuyết', role: EmployeeRole.MANAGER, phone: '0999123456', degree: 'Thạc sĩ Dược', age: 40, password: '123' },
];

// --- 10 REALISTIC CUSTOMERS ---
const customers: Customer[] = [
    { id: 'KH001', fullName: 'Nguyễn Thị Hoa', phone: '0901234567', age: 45, address: 'Q.1, TP.HCM', loyaltyPoints: 150, medicalHistory: 'Tiểu đường nhẹ', lastPurchaseDate: '20/10/2023' },
    { id: 'KH002', fullName: 'Trần Văn Bình', phone: '0912345678', age: 32, address: 'Q.3, TP.HCM', loyaltyPoints: 50, medicalHistory: '', lastPurchaseDate: '15/10/2023' },
    { id: 'KH003', fullName: 'Lê Thị Cúc', phone: '0923456789', age: 28, address: 'Q.5, TP.HCM', loyaltyPoints: 200, medicalHistory: 'Dị ứng Paracetamol', lastPurchaseDate: '25/10/2023' },
    { id: 'KH004', fullName: 'Phạm Văn Dũng', phone: '0934567890', age: 55, address: 'Q.10, TP.HCM', loyaltyPoints: 300, medicalHistory: 'Cao huyết áp', lastPurchaseDate: '10/10/2023' },
    { id: 'KH005', fullName: 'Hoàng Thị Mai', phone: '0945678901', age: 60, address: 'Q.TB, TP.HCM', loyaltyPoints: 450, medicalHistory: 'Thấp khớp', lastPurchaseDate: '01/10/2023' },
    { id: 'KH006', fullName: 'Vũ Văn Long', phone: '0956789012', age: 40, address: 'TP. Thủ Đức', loyaltyPoints: 80, medicalHistory: '', lastPurchaseDate: '22/10/2023' },
    { id: 'KH007', fullName: 'Đặng Thị Lan', phone: '0967890123', age: 25, address: 'Q.BT, TP.HCM', loyaltyPoints: 120, medicalHistory: 'Viêm mũi dị ứng', lastPurchaseDate: '18/10/2023' },
    { id: 'KH008', fullName: 'Bùi Văn Hùng', phone: '0978901234', age: 50, address: 'Q.GV, TP.HCM', loyaltyPoints: 250, medicalHistory: '', lastPurchaseDate: '05/10/2023' },
    { id: 'KH009', fullName: 'Ngô Thị Tuyết', phone: '0989012345', age: 35, address: 'Q.PN, TP.HCM', loyaltyPoints: 100, medicalHistory: 'Đau dạ dày', lastPurchaseDate: '12/10/2023' },
    { id: 'KH010', fullName: 'Lý Văn Nam', phone: '0990123456', age: 22, address: 'Q.4, TP.HCM', loyaltyPoints: 20, medicalHistory: '', lastPurchaseDate: '24/10/2023' }
];

export const initialData: AppData = {
  employees: employees,
  suppliers: generatedData.suppliers,
  customers: customers,
  products: generatedData.products,
  batches: generatedData.batches,
  salesInvoices: [],
  invoiceDetails: [],
  importInvoices: [],
  importDetails: [],
  countries: generatedData.countries,
  productTypes: productTypes,
  appSettings: {
    defaultPaymentMethod: PaymentMethod.CASH,
    pointValue: 1000,
    earnRate: 10000
  }
};
