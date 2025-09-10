import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, Eye, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Product, Category } from "@/types/Inventory";
import { productApi } from "@/services/api";
import { useCategories } from "@/contexts/CategoryContext";
import { Pagination } from "@/components/ui/pagination";

interface PaginatedProducts {
  content: Product[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// We'll use dynamic categories from existing products instead of hardcoded list
export const ProductManagement = () => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginatedProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    name: "",
    description: "",
    weight: 0,
    quantityInStock: 0,
    unitPrice: 0,
    batchNumber: "",
    category: { id: 0, name: "" },
    imageUrl: "/placeholder.svg",
  });

  // Update current product with first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !currentProduct.category?.id) {
      setCurrentProduct(prev => ({
        ...prev,
        category: categories[0]
      }));
    }
  }, [categories]);

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
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const handleOpenDialog = (mode: "add" | "edit" | "view", product?: Product) => {
    setDialogOpen(true);
    setEditMode(mode === "edit");
    setViewMode(mode === "view");
    
    if (product) {
      setCurrentProduct({ ...product });
    } else {
      setCurrentProduct({
        name: "",
        description: "",
        weight: 0,
        quantityInStock: 0,
        unitPrice: 0,
        batchNumber: "",
        category: categories.length > 0 ? categories[0] : { id: 0, name: "" },
        imageUrl: "/placeholder.svg",
      });
    }
  };

  const handleSave = async () => {
    if (!currentProduct.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    try {
      if (editMode && currentProduct.id) {
        await productApi.update(currentProduct.id, currentProduct);
        toast.success("Product updated successfully");
      } else {
        await productApi.create(currentProduct);
        toast.success("Product added successfully");
      }
      await fetchProducts();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  if (loading && !pagination) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productApi.delete(id);
        toast.success("Product deleted successfully");
        await fetchProducts();
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  // Filter products based on search and category filter
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = 
        (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.batchNumber && product.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (categoryFilter === "all") return matchesSearch;
      return matchesSearch && product.category?.name === categoryFilter;
    });

  if (loading && !pagination) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Button 
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
          onClick={() => handleOpenDialog("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search by name or batch number..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
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
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="unitPrice">Price</SelectItem>
                <SelectItem value="quantityInStock">Stock</SelectItem>
                <SelectItem value="createdAt">Date Added</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover-row">
                    <TableCell>{product.id}</TableCell>
                    <TableCell>
                      <div className="w-12 h-12 relative rounded-md overflow-hidden">
                        <img 
                          src={product.imageUrl || "/placeholder.svg"} 
                          alt={product.name} 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{product.batchNumber}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
                    <TableCell>{product.quantityInStock}</TableCell>
                    <TableCell>${product.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>{product.weight}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenDialog("view", product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenDialog("edit", product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => product.id && handleDelete(product.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.pageNumber}
                totalPages={pagination.totalPages}
                totalElements={pagination.totalElements}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSizeSelector={true}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          )}
          
          <div className="flex justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {pagination?.totalElements || 0} products
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Product" : viewMode ? "View Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="name">Product Name</label>
                <Input
                  id="name"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="category">Category</label>
                <Select
                  value={currentProduct.category?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedCategory = categories.find(c => c.id.toString() === value);
                    setCurrentProduct({ 
                      ...currentProduct, 
                      category: selectedCategory || { id: 0, name: "" } 
                    });
                  }}
                  disabled={viewMode || categoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-1.5 col-span-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="weight">Weight (kg)</label>
                <Input
                  id="weight"
                  type="number"
                  value={currentProduct.weight}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, weight: parseFloat(e.target.value) })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="quantityInStock">Quantity in Stock</label>
                <Input
                  id="quantityInStock"
                  type="number"
                  value={currentProduct.quantityInStock}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantityInStock: parseInt(e.target.value) })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="unitPrice">Unit Price ($)</label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={currentProduct.unitPrice}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, unitPrice: parseFloat(e.target.value) })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="batchNumber">Batch Number</label>
                <Input
                  id="batchNumber"
                  value={currentProduct.batchNumber}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, batchNumber: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="imageUrl">Image URL</label>
                <Input
                  id="imageUrl"
                  value={currentProduct.imageUrl}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              {viewMode && (
                <div className="col-span-2">
                  <img
                    src={currentProduct.imageUrl || "/placeholder.svg"}
                    alt={currentProduct.name}
                    className="w-full h-48 object-contain border rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {!viewMode && (
              <Button onClick={handleSave} className="bg-wms-yellow text-black hover:bg-wms-yellow-dark">
                {editMode ? "Update Product" : "Add Product"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {viewMode ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
