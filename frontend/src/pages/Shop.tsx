import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ShoppingCart,
  Filter,
  Loader2,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Pagination } from "@/components/ui/pagination";

import { useCategories } from "@/contexts/CategoryContext";
import { productApi } from "@/services/api";

interface PaginatedProducts {
  content: any[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const ShopPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginatedProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart, cartItemsCount } = useCart();
  const { categories } = useCategories();
  
  // Fetch products with pagination
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.getAllPaginated(currentPage, pageSize, sortBy, sortDir);
      setProducts(response.data.content);
      setPagination(response.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again.");
      toast.error("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when pagination parameters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, sortBy, sortDir]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, categoryFilter]);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (categoryFilter === "all") return matchesSearch;
    return matchesSearch && product.category?.name === categoryFilter;
  });

  const handleAddToCart = (product) => {
    if (product.quantityInStock <= 0) {
      toast.error("This item is out of stock");
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      sku: product.batchNumber,
      price: product.unitPrice,
      quantity: 1,
      image: product.imageUrl
    });
    
    toast.success(`${product.name} added to cart`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(0);
  };

  if (loading && !pagination) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse our warehouse products
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search products..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="unitPrice">Price</SelectItem>
                <SelectItem value="quantityInStock">Stock</SelectItem>
                <SelectItem value="createdAt">Date Added</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Link to="/cart">
            <Button className="bg-wms-yellow text-black hover:bg-wms-yellow-dark relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartItemsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover-card">
                <div className="aspect-square relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                  {product.quantityInStock <= 0 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 m-2 rounded-md">
                      Out of Stock
                    </div>
                  )}
                  {product.quantityInStock > 0 && product.quantityInStock < 5 && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 m-2 rounded-md">
                      Low Stock
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">{product.category?.name || "Uncategorized"}</div>
                  <div className="text-sm text-muted-foreground">SKU: {product.batchNumber}</div>
                  <div className="mt-2 text-lg font-bold">${product.unitPrice.toFixed(2)}</div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleAddToCart(product)} 
                    variant={product.quantityInStock > 0 ? "default" : "outline"} 
                    disabled={product.quantityInStock <= 0}
                    className="w-full bg-wms-yellow text-black hover:bg-wms-yellow-dark"
                  >
                    {product.quantityInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.pageNumber}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              showPageSizeSelector={true}
              pageSizeOptions={[6, 12, 24, 48]}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ShopPage;
