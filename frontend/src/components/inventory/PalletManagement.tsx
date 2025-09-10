import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pallet, Product } from "@/types/Inventory";
import { Position } from "@/types/warehouse";
import { productApi, palletApi, positionApi } from "@/services/api";

export const PalletManagement = () => {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [emptyPositions, setEmptyPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPallet, setCurrentPallet] = useState<Pallet>({
    palletName: "",
    quantity: 0,
    maximumCapacity: 0,
    manufacturingDate: new Date(),
    expiryDate: new Date(),
    supplierName: "",
    status: "stored",
    position: { id: 0, positionName: "", level: 0, bay: { id: 0, bayName: "",row_sy:null }, isEmpty: true },
    product: { id: 0, name: "", description: "", category: null,weight:0, quantityInStock:0, unitPrice:0, batchNumber:"", imageUrl:"" }
  });

  // Helper function to format position with full details
  const formatFullPosition = (position: Position | null | undefined) => {
    if (!position) return "N/A";
    
    // Get each part of the position hierarchy, handling null values
    const areaName = position.bay?.row_sy?.area?.areaName || "Unknown";
    const rowName = position.bay?.row_sy?.rowName || "Unknown";
    const bayName = position.bay?.bayName || "Unknown";
    const level = position.level || 0;
    const posName = position.positionName || "Unknown";
    
    return `${areaName}-${rowName}-${bayName}-${level}-${posName}`;
  };
  
  // Helper function to ensure we have complete position data
  const ensureCompletePositionData = async (positions: Position[]) => {
    // If positions already have complete data, return them
    if (positions.length > 0 && 
        positions[0].bay && 
        positions[0].bay.row_sy && 
        positions[0].bay.row_sy.area) {
      return positions;
    }
    
    try {
      // Get complete position data
      const response = await positionApi.getAll();
      const completePositions = response.data;
      
      // Map the IDs from our positions to the complete data
      return positions.map(pos => {
        const completePos = completePositions.find(cp => cp.id === pos.id);
        return completePos || pos;
      });
    } catch (error) {
      console.error('Error fetching complete position data:', error);
      return positions;
    }
  };

  // Fetch pallets, products and empty positions on component mount
  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const [palletsRes, productsRes, emptyPositionsRes, allPositionsRes] = await Promise.all([
          palletApi.getAll(),
          productApi.getAll(),
          palletApi.getEmptyPositions(),
          positionApi.getAll()
        ]);

        setPallets(palletsRes.data);
        setProducts(productsRes.data || []);
        
        // Ensure we have complete position data with full hierarchy
        const completeEmptyPositions = await ensureCompletePositionData(emptyPositionsRes.data || []);
        const completePositions = await ensureCompletePositionData(allPositionsRes.data || []);
        
        setEmptyPositions(completeEmptyPositions);
        setPositions(completePositions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (mode: "add" | "edit" | "view", pallet?: Pallet) => {
    if (isLoading || !products.length) {
      toast.error("Please wait while data is loading");
      return;
    }
    
    if (mode === "add" && emptyPositions.length === 0) {
      toast.error("No empty positions available for storing pallets");
      return;
    }
    setDialogOpen(true);
    setEditMode(mode === "edit");
    setViewMode(mode === "view");
    
    if (pallet) {
      // Create a copy of the pallet to edit
      const palletToEdit = { ...pallet };
      
      // Ensure we have the correct product from the products list
      const selectedProduct = products.find(p => p.id === pallet.product.id);
      if (selectedProduct) {
        palletToEdit.product = selectedProduct;
      }
      
      // For stored pallets, ensure we have the correct position
      if (pallet.status === 'stored' && pallet.position) {
        const currentPosition = positions.find(pos => pos.id === pallet.position.id);
        if (currentPosition) {
          palletToEdit.position = currentPosition;
        }
      } else {
        // For non-stored pallets, ensure we have a default position available if status changes to stored
        palletToEdit.position = emptyPositions.length > 0 ? emptyPositions[0] : positions[0];
      }
      
      // Set the current pallet with all the correct references
      setCurrentPallet(palletToEdit);
    } else {
      setCurrentPallet({
        palletName: "",
        quantity: 0,
        maximumCapacity: 0,
        manufacturingDate: new Date(),
        expiryDate: new Date(),
        supplierName: "",
        status: "stored",
        position: emptyPositions.length > 0 ? emptyPositions[0] : positions[0],
        product: products.length > 0 ? products[0] : {
          id: 0,
          name: "",
          description: "",
          category: null,
          weight: 0,
          quantityInStock: 0,
          unitPrice: 0,
          batchNumber: "",
          imageUrl: ""
        },
      });
    }
  };

  const handleSave = async () => {
    if (!currentPallet.palletName.trim()) {
      toast.error("Pallet name is required");
      return;
    }
    
    if (currentPallet.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (currentPallet.quantity > currentPallet.maximumCapacity) {
      toast.error(`Quantity exceeds maximum capacity (${currentPallet.maximumCapacity})`);
      return;
    }

    if (currentPallet.status === 'stored' && (!currentPallet.position || !currentPallet.position.id)) {
      toast.error('Position is required for stored pallets');
      return;
    }

    try {
      const palletData = {
        palletName: currentPallet.palletName,
        quantity: currentPallet.quantity,
        maximumCapacity: currentPallet.maximumCapacity,
        manufacturingDate: currentPallet.manufacturingDate,
        expiryDate: currentPallet.expiryDate,
        supplierName: currentPallet.supplierName,
        status: currentPallet.status,
        position: currentPallet.status === 'stored' ? { id: currentPallet.position.id } : null,
        product: { id: currentPallet.product.id }
      };

      if (editMode && currentPallet.id) {
        // Update existing pallet
        await palletApi.update(currentPallet.id, palletData);
        toast.success("Pallet updated successfully");
      } else {
        // Create new pallet
        await palletApi.create(palletData);
        toast.success("Pallet added successfully");
      }

      // Refresh data
      const [palletsRes, emptyPositionsRes, allPositionsRes] = await Promise.all([
        palletApi.getAll(),
        palletApi.getEmptyPositions(),
        positionApi.getAll()
      ]);

      setPallets(palletsRes.data);
      
      // Ensure we have complete position data with full hierarchy
      const completeEmptyPositions = await ensureCompletePositionData(emptyPositionsRes.data || []);
      const completePositions = await ensureCompletePositionData(allPositionsRes.data || []);
      
      setEmptyPositions(completeEmptyPositions);
      setPositions(completePositions);

      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving pallet:', error);
      toast.error('Failed to save pallet');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this pallet?")) {
      try {
        await palletApi.delete(id);
        toast.success("Pallet deleted successfully");
        
        // Refresh data
        const [palletsRes, emptyPositionsRes] = await Promise.all([
          palletApi.getAll(),
          palletApi.getEmptyPositions()
        ]);
        
        setPallets(palletsRes.data);
        
        // Ensure we have complete position data with full hierarchy
        const completeEmptyPositions = await ensureCompletePositionData(emptyPositionsRes.data || []);
        setEmptyPositions(completeEmptyPositions);
      } catch (error) {
        console.error('Error deleting pallet:', error);
        toast.error('Failed to delete pallet');
      }
    }
  };

  // Filter pallets based on search and status filter
  const filteredPallets = pallets.filter(pallet => {
    const matchesSearch = 
      (pallet.palletName && pallet.palletName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pallet.supplierName && pallet.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pallet.product && pallet.product.name && pallet.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && pallet.status === statusFilter;
  });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Pallet Management</h2>
        <Button 
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
          onClick={() => handleOpenDialog("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pallet
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search by name, supplier or product..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="stored">Stored</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="Ready to Ship">Ready to Ship</SelectItem>
                <SelectItem value="Ready to Store">Ready to Store</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          

        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Pallet Name</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPallets.map((pallet) => (
              <TableRow key={pallet.id} className="hover-row">
                <TableCell>{pallet.id}</TableCell>
                <TableCell>{pallet.palletName}</TableCell>
                <TableCell>{pallet.product?.name}</TableCell>
                <TableCell>{pallet.quantity} / {pallet.maximumCapacity}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    pallet.status === "stored" ? "bg-green-100 text-green-800" :
                    pallet.status === "shipping" ? "bg-blue-100 text-blue-800" :
                    pallet.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                    pallet.status === "Ready to Ship" ? "bg-purple-100 text-purple-800" :
                    pallet.status === "Ready to Store" ? "bg-emerald-100 text-emerald-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {pallet.status.charAt(0).toUpperCase() + pallet.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  {pallet.status === "stored" && pallet.position ? 
                    formatFullPosition(pallet.position) : 
                    "N/A"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("view", pallet)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("edit", pallet)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => pallet.id && handleDelete(pallet.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredPallets.length} of {pallets.length} pallets
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Pallet" : viewMode ? "View Pallet" : "Add Pallet"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="palletName">Pallet Name</label>
                <Input
                  id="palletName"
                  value={currentPallet.palletName}
                  onChange={(e) => setCurrentPallet({ ...currentPallet, palletName: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="product">Product</label>
                <Select
                  value={currentPallet.product?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedProduct = products.find(p => p.id === parseInt(value));
                    if (selectedProduct) {
                      setCurrentPallet({ ...currentPallet, product: selectedProduct });
                    }
                  }}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id?.toString() || ""}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="maximumCapacity">Maximum Capacity</label>
                <Input
                  id="maximumCapacity"
                  type="number"
                  value={currentPallet.maximumCapacity}
                  onChange={(e) => setCurrentPallet({ ...currentPallet, maximumCapacity: parseInt(e.target.value) })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="quantity">Quantity</label>
                <Input
                  id="quantity"
                  type="number"
                  value={currentPallet.quantity}
                  onChange={(e) => setCurrentPallet({ ...currentPallet, quantity: parseInt(e.target.value) })}
                  readOnly={viewMode}
                />
                {currentPallet.quantity > currentPallet.maximumCapacity && (
                  <p className="text-xs text-red-500">
                    Quantity exceeds maximum capacity
                  </p>
                )}
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="manufacturingDate">Manufacturing Date</label>
                <Input
                  id="manufacturingDate"
                  type="date"
                  value={formatDateForInput(currentPallet.manufacturingDate)}
                  onChange={(e) => setCurrentPallet({ 
                    ...currentPallet, 
                    manufacturingDate: new Date(e.target.value) 
                  })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="expiryDate">Expiry Date</label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formatDateForInput(currentPallet.expiryDate)}
                  onChange={(e) => setCurrentPallet({ 
                    ...currentPallet, 
                    expiryDate: new Date(e.target.value) 
                  })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="supplierName">Supplier Name</label>
                <Input
                  id="supplierName"
                  value={currentPallet.supplierName}
                  onChange={(e) => setCurrentPallet({ ...currentPallet, supplierName: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="status">Status</label>
                <Select
                  value={currentPallet.status}
                  onValueChange={(value: "stored" | "shipping" | "processing" | "Ready to Ship" | "Ready to Store" | "damaged") => {
                    setCurrentPallet({ ...currentPallet, status: value });
                  }}
                  disabled={viewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stored">Stored</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="Ready to Ship">Ready to Ship</SelectItem>
                    <SelectItem value="Ready to Store">Ready to Store</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Position selection is only shown when status is 'stored' */}
              {currentPallet.status === 'stored' && (
                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor="position">Position</label>
                  {viewMode ? (
                    <Input
                      id="position"
                      value={currentPallet.position ? 
                        formatFullPosition(currentPallet.position) : 
                        "N/A"}
                      readOnly
                    />
                  ) : (
                    <Select
                      value={currentPallet.position?.id?.toString() || ""}
                      onValueChange={(value) => {
                        const selectedPosition = [...emptyPositions, ...(currentPallet.id ? [currentPallet.position] : [])]
                          .find(p => p.id === parseInt(value));
                        if (selectedPosition) {
                          setCurrentPallet({ ...currentPallet, position: selectedPosition });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Include current position and empty positions */}
                        {[...(currentPallet.id ? [currentPallet.position] : []), ...emptyPositions]
                          .filter((pos, index, self) => 
                            pos.id && self.findIndex(p => p.id === pos.id) === index
                          )
                          .map((position) => (
                            <SelectItem key={position.id} value={position.id?.toString() || ""}>
                              {formatFullPosition(position)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              {/* Show a note when status is not 'stored' */}
              {currentPallet.status !== 'stored' && !viewMode && (
                <div className="grid w-full items-center gap-1.5">
                  <p className="text-sm text-muted-foreground">
                    Position will be assigned when status is set to 'Stored'
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {!viewMode && (
              <Button onClick={handleSave} className="bg-wms-yellow text-black hover:bg-wms-yellow-dark">
                {editMode ? "Update Pallet" : "Add Pallet"}
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


const formatDateForInput = (date: Date | string | undefined) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
};
