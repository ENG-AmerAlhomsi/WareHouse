
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, Eye } from "lucide-react";
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
import { toast } from "sonner";
import { Area } from "@/types/warehouse";
import { areaApi } from "@/services/api";

const AreaManagement = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch areas on component mount
  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await areaApi.getAll();
      setAreas(response.data);
    } catch (error) {
      toast.error("Failed to fetch areas");
      console.error("Error fetching areas:", error);
    } finally {
      setLoading(false);
    }
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentArea, setCurrentArea] = useState<Area>({ areaName: "" });

  const handleOpenDialog = (mode: "add" | "edit" | "view", area?: Area) => {
    setDialogOpen(true);
    setEditMode(mode === "edit");
    setViewMode(mode === "view");
    
    if (area) {
      setCurrentArea({ ...area });
    } else {
      setCurrentArea({ areaName: "" });
    }
  };

  const handleSave = async () => {
    if (!currentArea.areaName.trim()) {
      toast.error("Area name is required");
      return;
    }
    
    try {
      if (editMode && currentArea.id) {
        // Update existing area
        await areaApi.update(currentArea.id, { areaName: currentArea.areaName });
        toast.success("Area updated successfully");
      } else {
        // Add new area
        await areaApi.create({ areaName: currentArea.areaName });
        toast.success("Area added successfully");
      }
      
      // Refresh the areas list
      await fetchAreas();
      setDialogOpen(false);
    } catch (error) {
      toast.error(editMode ? "Failed to update area" : "Failed to create area");
      console.error("Error saving area:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this area?")) {
      try {
        await areaApi.delete(id);
        toast.success("Area deleted successfully");
        // Refresh the areas list
        await fetchAreas();
      } catch (error) {
        toast.error("Failed to delete area");
        console.error("Error deleting area:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Area Management</h2>
        <Button 
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
          onClick={() => handleOpenDialog("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Area
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas
              .sort((a, b) => (b.id || 0) - (a.id || 0)) // Sort by ID (newest first)
              .map((area) => (
              <TableRow key={area.id} className="hover-row">
                <TableCell>{area.id}</TableCell>
                <TableCell>{area.areaName}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("view", area)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("edit", area)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => area.id && handleDelete(area.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Area" : viewMode ? "View Area" : "Add Area"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="areaName">Area Name</label>
                <Input
                  id="areaName"
                  value={currentArea.areaName}
                  onChange={(e) => setCurrentArea({ ...currentArea, areaName: e.target.value })}
                  readOnly={viewMode}
                />
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

export default AreaManagement;
