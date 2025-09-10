
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
import { Bay, Row } from "@/types/warehouse";
import { bayApi, rowApi } from "@/services/api";

const BayManagement = () => {
  const [bays, setBays] = useState<Bay[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentBay, setCurrentBay] = useState<Bay>({
    bayName: "",
    row_sy: { id: 0, rowName: "", area: { id: 0, areaName: "" } },
  });

  const handleOpenDialog = (mode: "add" | "edit" | "view", bay?: Bay) => {
    setDialogOpen(true);
    setEditMode(mode === "edit");
    setViewMode(mode === "view");
    
    if (bay && bay.row_sy) {
      setCurrentBay({ ...bay });
    } else {
      setCurrentBay({
        bayName: "",
        row_sy: {
          id: rows[0]?.id || 0,
          rowName: rows[0]?.rowName || "",
          area: { id: rows[0]?.area?.id || 0, areaName: rows[0]?.area?.areaName || "" },
        },
      });
    }
  };

  useEffect(() => {
    loadBays();
    loadRows();
  }, []);

  const loadBays = async () => {
    try {
      const response = await bayApi.getAll();
      setBays(response.data);
    } catch (error) {
      toast.error("Failed to load bays");
    }
  };

  const loadRows = async () => {
    try {
      const response = await rowApi.getAll();
      setRows(response.data);
      if (response.data.length > 0) {
        setCurrentBay((prev) => ({
          ...prev,
          row_sy: response.data[0],
        }));
      }
    } catch (error) {
      toast.error("Failed to load rows");
    }
  };

  const handleSave = async () => {
    if (!currentBay.bayName.trim()) {
      toast.error("Bay name is required");
      return;
    }

    try {
      if (!currentBay.row_sy || !currentBay.row_sy.id) {
        toast.error("Please select a valid row");
        return;
      }

      const payload = {
        bayName: currentBay.bayName,
        row_sy: {
          id: currentBay.row_sy.id,
        },
      };

      if (editMode && currentBay.id) {
        await bayApi.update(currentBay.id, payload);
        toast.success("Bay updated successfully");
      } else {
        await bayApi.create(payload);
        toast.success("Bay added successfully");
      }
      await loadBays();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save bay");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this bay?")) {
      try {
        await bayApi.delete(id);
        toast.success("Bay deleted successfully");
        loadBays();
      } catch (error) {
        toast.error("Failed to delete bay");
      }
    }
  };

  const handleRowChange = (rowId: string) => {
    const selectedRow = rows.find((row) => row.id === parseInt(rowId));
    if (selectedRow) {
      setCurrentBay({ ...currentBay, row_sy: selectedRow });
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Bay Management</h2>
        <Button 
          className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
          onClick={() => handleOpenDialog("add")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bay
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Row</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bays
              .sort((a, b) => (b.id || 0) - (a.id || 0)) // Sort by ID (newest first)
              .map((bay) => (
              <TableRow key={bay.id} className="hover-row">
                <TableCell>{bay.id}</TableCell>
                <TableCell>{bay.bayName}</TableCell>
                <TableCell>{bay.row_sy.rowName}</TableCell>
                <TableCell>{bay.row_sy.area.areaName}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("view", bay)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog("edit", bay)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => bay.id && handleDelete(bay.id)}
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
              {editMode ? "Edit Bay" : viewMode ? "View Bay" : "Add Bay"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="bayName">Bay Name</label>
                <Input
                  id="bayName"
                  value={currentBay.bayName}
                  onChange={(e) => setCurrentBay({ ...currentBay, bayName: e.target.value })}
                  readOnly={viewMode}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="row">Row</label>
                <Select 
                  disabled={viewMode}
                  value={currentBay.row_sy.id?.toString()}
                  onValueChange={handleRowChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a row" />
                  </SelectTrigger>
                  <SelectContent>
                    {rows.map((row) => (
                      <SelectItem key={row.id} value={row.id?.toString() || ""}>
                        {row.rowName} ({row.area.areaName})
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

export default BayManagement;
