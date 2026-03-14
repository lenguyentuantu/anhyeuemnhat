
import { Product, Batch, AppData } from '../types';

// Define result structure for paginated queries
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class DatabaseService {
  private products: Product[] = [];
  private batches: Batch[] = [];
  private initialized: boolean = false;

  constructor() {
    // No external library initialization needed anymore
    this.initialized = true;
  }

  // Load Initial Data into Memory
  loadData(products: Product[], batches: Batch[]) {
    try {
      // Store references to the data arrays
      this.products = [...products];
      this.batches = [...batches];
      console.log(`Loaded ${this.products.length} products and ${this.batches.length} batches into Memory DB.`);
    } catch (e) {
      console.error("Error loading data:", e);
    }
  }

  // Advanced Search & Pagination Query (Native JS Implementation)
  searchProducts(
    searchTerm: string, 
    page: number = 1, 
    pageSize: number = 20, 
    typeId: string = 'ALL'
  ): PaginatedResult<Product> {
    
    // 1. Filtering
    let filteredResults = this.products;

    // Filter by Type
    if (typeId !== 'ALL') {
      filteredResults = filteredResults.filter(p => p.typeId === typeId);
    }

    // Filter by Search Term (Search in Name, ID, Ingredients)
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filteredResults = filteredResults.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.id.toLowerCase().includes(term) || 
        (p.drugDetail?.ingredients || '').toLowerCase().includes(term)
      );
    }

    // 2. Sorting (Default sort by Name)
    // Create a shallow copy before sorting to avoid mutating original order randomly
    filteredResults = [...filteredResults].sort((a, b) => a.name.localeCompare(b.name));

    // 3. Pagination
    const total = filteredResults.length;
    const totalPages = Math.ceil(total / pageSize);
    
    // Ensure page is within valid bounds
    const currentPage = Math.max(1, Math.min(page, Math.max(1, totalPages)));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const pagedData = filteredResults.slice(startIndex, endIndex);

    return {
      data: pagedData,
      total,
      page: currentPage,
      pageSize,
      totalPages
    };
  }

  // Get Stock for a Product (Native JS Reduce)
  getStock(productId: string): number {
    return this.batches
      .filter(b => b.productId === productId)
      .reduce((sum, b) => sum + b.currentStock, 0);
  }
}

export const db = new DatabaseService();
