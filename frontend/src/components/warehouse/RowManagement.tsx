
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Area, Row } from "@/types/warehouse";
import { rowApi, areaApi } from "@/services/api";

const RowManagement = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentRow, setCurrentRow] = useState<Row>({ rowName: "", area: { id: 0, areaName: "" } });

  const handleOpenDialog = (mode: "add" | "edit" | "view", row?: Row) => {
    setDialogOpen(true);
    setEditMode(mode === "edit");
    setViewMode(mode === "view");
    
    if (row && row.area) {
      setCurrentRow({ ...row });
    } else {
      setCurrentRow({ rowName: "", area: { id: areas[0]?.id || 0, areaName: areas[0]?.areaName || "" } });
    }
  };

  useEffect(() => {
    loadRows();
    loadAreas();
  }, []);

  const loadRows = async () => {
    try {
      const response = await rowApi.getAll();
      setRows(response.data);
    } catch (error) {
      toast.error("Failed to load rows");
    }
  };

  const loadAreas = async () => {
    try {
      const response = await areaApi.getAll();
      setAreas(response.data);
      if (response.data.length > 0) {
        setCurrentRow(prev => ({ ...prev, area: response.data[0] }));
      }
    } catch (error) {
      toast.error("Failed to load areas");
    }
  };

  const handleSave = async () => {
    if (!currentRow.rowName.trim()) {
      toast.error("Row name is required");
      return;
    }
    
    try {
      // Ensure we have a valid area ID
      if (!currentRow.area || !currentRow.area.id) {
        toast.error("Please select a valid area");
        return;
      }

      const payload = {
           rowName: currentRow.rowName,
           area: {
             id: currentRow.area.id
           }
         };

      if (editMode && currentRow.id) {
        // Update existing row
        await rowApi.update(currentRow.id, payload);
        toast.success("Row updated successfully");
      } else {
        // Add new row
        await rowApi.create(payload);
        toast.success("Row added successfully");
      }
      await loadRows();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save row");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this row?")) {
      try {
        await rowApi.delete(id);
        toast.success("Row deleted successfully");
        loadRows();
      } catch (error) {
        toast.error("Failed to delete row");
      }
    }
  };

  const handleAreaChange = (areaId: string) => {
    const selectedArea = areas.find(area => area.id === parseInt(areaId));
    if (selectedArea) {
      setCurrentRow({ ...currentRow, area: selectedArea });
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Row Management</h2>
        <Button 
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
          onClick={() => handleOpenDialog("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows
              .sort((a, b) => (b.id || 0) - (a.id || 0)) // Sort by ID (newest first)
              .map((row) => (
              <TableRow key={row.id} className="hover-row">
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.rowName}</TableCell>
                <TableCell>{row.area?.areaName || "No Area Assigned"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("view", row)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("edit", row)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => row.id && handleDelete(row.id)}
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
              {editMode ? "Edit Row" : viewMode ? "View Row" : "Add Row"}
            </DialogTitle>
            <DialogDescription>
              {editMode ? "Update the row details" : viewMode ? "View row information" : "Create a new row in the warehouse"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="rowName">Row Name</label>
                <Input
                  id="rowName"
                  value={currentRow.rowName}
                  onChange={(e) => setCurrentRow({ ...currentRow, rowName: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="area">Area</label>
                <Select 
                  disabled={viewMode}
                  value={currentRow.area.id?.toString()}
                  onValueChange={handleAreaChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id?.toString() || ""}>
                        {area.areaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

export default RowManagement;
