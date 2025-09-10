
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
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bay, Position } from "@/types/warehouse";
import { palletApi,positionApi, bayApi } from "@/services/api";

const PositionManagement = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPosition, setCurrentPosition] = useState<Position>({ 
    positionName: "", 
    level: 1,
    isEmpty: true, 
    bay: { id: 0, bayName: "", row_sy: { id: 0, rowName: "", area: { id: 0, areaName: "" } } }
  });
  const [bays, setBays] = useState<Bay[]>([]);

  useEffect(() => {
    loadPositions();
    loadBays();
  }, []);

  const loadPositions = async () => {
    try {
      const response = await positionApi.getAll();
      setPositions(response.data);
    } catch (error) {
      toast.error("Failed to load positions");
    }
  };

  const loadBays = async () => {
    try {
      const response = await bayApi.getAll();
      setBays(response.data);
      if (response.data.length > 0) {
        setCurrentPosition((prev) => ({
          ...prev,
          bay: response.data[0],
        }));
      }
    } catch (error) {
      toast.error("Failed to load bays");
    }
  };

  const handleOpenDialog = (mode: "add" | "edit" | "view", position?: Position) => {
    setDialogOpen(true);
    setEditMode(mode === "edit");
    setViewMode(mode === "view");
    
    if (position) {
      setCurrentPosition({ ...position });
    } else {
      setCurrentPosition({ positionName: "", level: 1, isEmpty: true, bay: bays[0] });
    }
  };

  const handleSave = async () => {
    if (!currentPosition.positionName.trim()) {
      toast.error("Position name is required");
      return;
    }

    // Check for linked pallets when changing status from occupied to empty
    if (editMode && currentPosition.isEmpty) {
      try {
        const palletsResponse = await palletApi.getAll();
        const linkedPallet = palletsResponse.data.find(
          pallet => pallet.position?.id === currentPosition.id
        );
        
        if (linkedPallet) {
          toast.error("Cannot mark position as empty. There is a pallet stored in this position.");
          return;
        }
      } catch (error) {
        toast.error("Failed to check for linked pallets");
        return;
      }
    }

    try {
      if (!currentPosition.bay || !currentPosition.bay.id) {
        toast.error("Please select a valid bay");
        return;
      }

      const payload = {
        positionName: currentPosition.positionName,
        level: currentPosition.level,
        isEmpty: currentPosition.isEmpty,
        bay: {
          id: currentPosition.bay.id,
        },
      };

      if (editMode && currentPosition.id) {
        await positionApi.update(currentPosition.id, payload);
        toast.success("Position updated successfully");
      } else {
        await positionApi.create(payload);
        toast.success("Position added successfully");
      }
      await loadPositions();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save position");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this position?")) {
      try {
        await positionApi.delete(id);
        toast.success("Position deleted successfully");
        loadPositions();
      } catch (error) {
        toast.error("Failed to delete position");
      }
    }
  };

  const handleBayChange = (bayId: string) => {
    const selectedBay = bays.find(bay => bay.id === parseInt(bayId));
    if (selectedBay) {
      setCurrentPosition({ ...currentPosition, bay: selectedBay });
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Position Management</h2>
        <Button 
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
          onClick={() => handleOpenDialog("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search by name, bay, row or area..." 
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="empty">Empty</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Bay</TableHead>
              <TableHead>Row</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions
              .filter(position => {
                const matchesSearch = 
                  position.positionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  position.bay.bayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  position.bay.row_sy.rowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  position.bay.row_sy.area.areaName.toLowerCase().includes(searchQuery.toLowerCase());
                
                if (statusFilter === "all") return matchesSearch;
                return matchesSearch && 
                  ((statusFilter === "empty" && position.isEmpty) ||
                   (statusFilter === "occupied" && !position.isEmpty));
              })
              .sort((a, b) => {
                // Sort by ID (newest first) - assuming higher IDs are newer positions
                if (a.id && b.id) {
                  return b.id - a.id;
                }
                return 0;
              })
              .map((position) => (
              <TableRow key={position.id} className="hover-row">
                <TableCell>{position.id}</TableCell>
                <TableCell>{position.positionName}</TableCell>
                <TableCell>{position.level}</TableCell>
                <TableCell>{position.bay.bayName}</TableCell>
                <TableCell>{position.bay.row_sy.rowName}</TableCell>
                <TableCell>{position.bay.row_sy.area.areaName}</TableCell>
                <TableCell>
                  <span className={position.isEmpty ? "text-gray-500" : "text-green-500"}>
                    {position.isEmpty ? "Empty" : "Occupied"}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("view", position)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("edit", position)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => position.id && handleDelete(position.id)}
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
          Showing {positions.filter(position => {
            const matchesSearch = 
              position.positionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              position.bay.bayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              position.bay.row_sy.rowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              position.bay.row_sy.area.areaName.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (statusFilter === "all") return matchesSearch;
            return matchesSearch && 
              ((statusFilter === "empty" && position.isEmpty) ||
               (statusFilter === "occupied" && !position.isEmpty));
          }).length} of {positions.length} positions
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Position" : viewMode ? "View Position" : "Add Position"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="positionName">Position Name</label>
                <Input
                  id="positionName"
                  value={currentPosition.positionName}
                  onChange={(e) => setCurrentPosition({ ...currentPosition, positionName: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="level">Level</label>
                <Input
                  id="level"
                  type="number"
                  min={1}
                  value={currentPosition.level}
                  onChange={(e) => setCurrentPosition({ 
                    ...currentPosition, 
                    level: parseInt(e.target.value) || 1
                  })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="bay">Bay</label>
                <Select 
                  disabled={viewMode}
                  value={currentPosition.bay.id?.toString()}
                  onValueChange={handleBayChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {bays.map(bay => (
                      <SelectItem key={bay.id} value={bay.id?.toString() || ""}>
                        {bay.bayName} ({bay.row_sy.rowName}, {bay.row_sy.area.areaName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="isEmpty">Empty:</label>
                <Switch
                  id="isEmpty"
                  checked={currentPosition.isEmpty}
                  onCheckedChange={(checked) => setCurrentPosition({ ...currentPosition, isEmpty: checked })}
                  disabled={viewMode}
                />
                <span className={currentPosition.isEmpty ? "text-gray-500" : "text-green-500"}>
                  {currentPosition.isEmpty ? "Empty" : "Occupied"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            {!viewMode && (
              <Button
                className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
                onClick={handleSave}
              >
                Save
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

export default PositionManagement;
