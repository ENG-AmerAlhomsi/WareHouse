import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Save, X, RefreshCcw } from "lucide-react";
import { useCategories } from "@/contexts/CategoryContext";
import { toast } from "sonner";

export const CategoryManagement = () => {
  const { categories, loading, error, refreshCategories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: number, name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      await addCategory(newCategoryName);
      setNewCategoryName("");
      toast.success("Category added successfully");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      await updateCategory(editingCategory.id, editingCategory.name);
      setEditingCategory(null);
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      setConfirmDelete(null);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Categories</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refreshCategories()}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Manage product categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
            />
            <Button 
              onClick={handleAddCategory} 
              disabled={loading || !newCategoryName.trim()}
              className="bg-wms-yellow text-black hover:bg-wms-yellow-dark"
            >
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>

          {error && (
            <div className="text-red-500 my-2">{error}</div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No categories found. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>
                      {editingCategory?.id === category.id ? (
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          autoFocus
                        />
                      ) : (
                        category.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCategory?.id === category.id ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleUpdateCategory}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setEditingCategory(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : confirmDelete === category.id ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setConfirmDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}; 