import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AreaManagement from "@/components/warehouse/AreaManagement";
import RowManagement from "@/components/warehouse/RowManagement";
import BayManagement from "@/components/warehouse/BayManagement";
import PositionManagement from "@/components/warehouse/PositionManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, Row, Bay, Position } from "@/types/warehouse";
import { Pallet } from "@/types/Inventory";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Search, Filter, MapPin, Package, Warehouse } from "lucide-react";

import { areaApi, rowApi, bayApi, positionApi, palletApi } from '@/services/api';
import { Button } from '@/components/ui/button';

interface WarehouseStructureData {
  area: string;
  rows: {
    row: string;
    bays: {
      bay: string;
      positions: {
        id: number;
        name: string;
        level: number;
        isEmpty: boolean;
        productInfo?: {
          productName: string;
          quantity: number;
        };
      }[];
    }[];
  }[];
}

// Helper function to get color based on level
const getLevelColor = (level: number) => {
  switch (level) {
    case 1:
      return { bg: 'bg-[#fff2b2]', border: 'border-[#f0d878]', text: 'text-black' };
    case 2:
      return { bg: 'bg-[#dec5e3]', border: 'border-[#c2a5c8]', text: 'text-black' };
    case 3:
      return { bg: 'bg-[#b3d4ff]', border: 'border-[#80b0e6]', text: 'text-black' };
    case 4:
      return { bg: 'bg-[#c8e6c9]', border: 'border-[#a5d6a7]', text: 'text-black' };
    case 5:
      return { bg: 'bg-[#ffcdd2]', border: 'border-[#ef9a9a]', text: 'text-black' };
    default:
      return { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-black' };
  }
};

const WarehouseStructure = () => {
  const [currentTab, setCurrentTab] = useState("areas");
  const [areas, setAreas] = useState<Area[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [bays, setBays] = useState<Bay[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [warehouseStructure, setWarehouseStructure] = useState<WarehouseStructureData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "occupied" | "empty">("all");

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [areasRes, rowsRes, baysRes, positionsRes, palletsRes] = await Promise.all([
          areaApi.getAll(),
          rowApi.getAll(),
          bayApi.getAll(),
          positionApi.getAll(),
          palletApi.getAll()
        ]);

        setAreas(areasRes.data);
        setRows(rowsRes.data);
        setBays(baysRes.data);
        setPositions(positionsRes.data);
        setPallets(palletsRes.data);

        // Transform data into warehouse structure
        const structure = areasRes.data.map((area) => {
          const areaRows = rowsRes.data.filter((row) => row.area.id === area.id);
          return {
            area: area.areaName,
            rows: areaRows.map((row) => {
              const rowBays = baysRes.data.filter((bay) => bay.row_sy.id === row.id);
              return {
                row: row.rowName,
                bays: rowBays.map((bay) => {
                  const bayPositions = positionsRes.data.filter((pos) => pos.bay.id === bay.id);
                  
                  // Get position details with product info
                  const positionsWithInfo = bayPositions.map(position => {
                    // Find if there's a pallet in this position
                    const pallet = palletsRes.data.find(p => p.position && p.position.id === position.id);
                    
                    return {
                      id: position.id,
                      name: position.positionName,
                      level: position.level,
                      isEmpty: position.isEmpty,
                      productInfo: pallet ? {
                        productName: pallet.product.name,
                        quantity: pallet.quantity
                      } : undefined
                    };
                  });
                  
                  return {
                    bay: bay.bayName,
                    positions: positionsWithInfo
                  };
                })
              };
            })
          };
        });

        setWarehouseStructure(structure);
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrintAll = async () => {
    try {
      setDownloading(true);
      const res = await positionApi.printAllLabels();
      downloadBlob(res.data, 'positions-all.pdf');
    } catch (e) {
      console.error('Failed to print all labels', e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintNew = async () => {
    try {
      setDownloading(true);
      const res = await positionApi.printNewLabels();
      downloadBlob(res.data, 'positions-new.pdf');
      // refresh positions to reflect isNew=false updates
      const positionsRes = await positionApi.getAll();
      setPositions(positionsRes.data);
    } catch (e) {
      console.error('Failed to print new labels', e);
    } finally {
      setDownloading(false);
    }
  };

  // Filter and search functionality
  const filteredWarehouseStructure = warehouseStructure.map(area => ({
    ...area,
    rows: area.rows.map(row => ({
      ...row,
      bays: row.bays.map(bay => ({
        ...bay,
        positions: bay.positions.filter(position => {
          const matchesSearch = searchTerm === "" || 
            position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (position.productInfo?.productName.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
          
          const matchesLevel = filterLevel === "all" || position.level === filterLevel;
          
          const matchesStatus = filterStatus === "all" || 
            (filterStatus === "occupied" && !position.isEmpty) ||
            (filterStatus === "empty" && position.isEmpty);
          
          return matchesSearch && matchesLevel && matchesStatus;
        })
      })).filter(bay => bay.positions.length > 0)
    })).filter(row => row.bays.length > 0)
  })).filter(area => area.rows.length > 0);

  // Calculate statistics
  const totalPositions = warehouseStructure.reduce((acc, area) => 
    acc + area.rows.reduce((rowAcc, row) => 
      rowAcc + row.bays.reduce((bayAcc, bay) => bayAcc + bay.positions.length, 0), 0), 0);
  
  const occupiedPositions = warehouseStructure.reduce((acc, area) => 
    acc + area.rows.reduce((rowAcc, row) => 
      rowAcc + row.bays.reduce((bayAcc, bay) => 
        bayAcc + bay.positions.filter(pos => !pos.isEmpty).length, 0), 0), 0);
  
  const occupancyRate = totalPositions > 0 ? Math.round((occupiedPositions / totalPositions) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Warehouse Structure Management</h1>
        <p className="text-muted-foreground">
          Manage your warehouse areas, rows, bays, and positions
        </p>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Areas</p>
                <p className="text-2xl font-bold">{warehouseStructure.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Positions</p>
                <p className="text-2xl font-bold">{totalPositions}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{occupiedPositions}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold">{occupancyRate}%</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={handlePrintAll} disabled={downloading}>
              {downloading ? 'Preparing…' : 'Print All'}
            </Button>
            <Button variant="secondary" onClick={handlePrintNew} disabled={downloading}>
              {downloading ? 'Preparing…' : 'Print New'}
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="rows">Rows</TabsTrigger>
          <TabsTrigger value="bays">Bays</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="structure">Warehouse Structure</TabsTrigger>
        </TabsList>
        
        <TabsContent value="areas">
          <Card className="p-6">
            <AreaManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="rows">
          <Card className="p-6">
            <RowManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="bays">
          <Card className="p-6">
            <BayManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="positions">
          <Card className="p-6">
            <PositionManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="structure" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wms-yellow"></div>
              <span className="ml-3">Loading warehouse structure...</span>
            </div>
          ) : (
            <>
              {/* Search and Filter Controls */}
              <Card className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search positions or products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Levels</option>
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2</option>
                        <option value={3}>Level 3</option>
                        <option value={4}>Level 4</option>
                        <option value={5}>Level 5</option>
                      </select>
                      
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as "all" | "occupied" | "empty")}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="occupied">Occupied</option>
                        <option value="empty">Empty</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
              
              <div className="space-y-8">
                {filteredWarehouseStructure.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No positions found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </Card>
                ) : (
                  filteredWarehouseStructure.map((area, areaIndex) => (
                <Card key={areaIndex} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        A{areaIndex + 1}
                      </div>
                      <div>
                        <span className="text-xl">Warehouse Area: {area.area}</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          {area.rows.length} rows • {area.rows.reduce((acc, row) => acc + row.bays.length, 0)} bays • {area.rows.reduce((acc, row) => acc + row.bays.reduce((bayAcc, bay) => bayAcc + bay.positions.length, 0), 0)} positions
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {area.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="space-y-4">
                          {/* Row Header */}
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-white text-sm font-bold">
                              R{rowIndex + 1}
                            </div>
                            <h3 className="text-lg font-semibold">Row {row.row}</h3>
                            <div className="ml-auto text-sm text-muted-foreground">
                              {row.bays.length} bays
                            </div>
                          </div>
                          
                          {/* Bays Grid - Representing actual warehouse layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {row.bays.map((bay, bayIndex) => (
                              <div key={bayIndex} className="space-y-3">
                                {/* Bay Header */}
                                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-md">
                                  <div className="w-5 h-5 bg-slate-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                    B{bayIndex + 1}
                                  </div>
                                  <span className="font-medium">Bay {bay.bay}</span>
                                  <div className="ml-auto text-xs text-muted-foreground">
                                    {bay.positions.length} positions
                                  </div>
                                </div>
                                
                                {/* Positions - Representing actual storage rack */}
                                <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
                                  <div className="grid grid-cols-2 gap-2">
                                    {bay.positions.map((position, posIndex) => {
                                      const levelColors = getLevelColor(position.level);
                                      const isOccupied = !position.isEmpty;
                                      
                                      return (
                                        <TooltipProvider key={posIndex}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className={`
                                                relative p-2 rounded border-2 transition-all duration-200 hover:scale-105 cursor-pointer
                                                ${isOccupied 
                                                  ? `${levelColors.bg} ${levelColors.border} shadow-md hover:shadow-lg` 
                                                  : 'bg-white border-gray-300 hover:border-gray-400'
                                                }
                                              `}>
                                                {/* Position Label */}
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className={`text-xs font-bold ${isOccupied ? levelColors.text : 'text-gray-600'}`}>
                                                    P{position.name}
                                                  </span>
                                                  <div className={`
                                                    w-2 h-2 rounded-full
                                                    ${isOccupied ? 'bg-green-500' : 'bg-gray-300'}
                                                  `} />
                                                </div>
                                                
                                                {/* Level Indicator */}
                                                <div className={`text-xs ${isOccupied ? levelColors.text : 'text-gray-500'}`}>
                                                  L{position.level}
                                                </div>
                                                
                                                {/* Product Info */}
                                                {isOccupied && position.productInfo && (
                                                  <div className="mt-1 space-y-1">
                                                    <div className={`text-xs font-medium truncate ${levelColors.text}`}>
                                                      {position.productInfo.productName.substring(0, 12)}
                                                      {position.productInfo.productName.length > 12 ? '...' : ''}
                                                    </div>
                                                    <div className={`text-xs ${levelColors.text}`}>
                                                      Qty: {position.productInfo.quantity}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Empty State */}
                                                {!isOccupied && (
                                                  <div className="text-xs text-gray-400 mt-1">
                                                    Available
                                                  </div>
                                                )}
                                              </div>
                                            </TooltipTrigger>
                                            {isOccupied && position.productInfo && (
                                              <TooltipContent className="max-w-xs">
                                                <div className="p-3 space-y-2">
                                                  <div className="font-bold text-sm">{position.productInfo.productName}</div>
                                                  <div className="text-xs space-y-1">
                                                    <div>Quantity: {position.productInfo.quantity}</div>
                                                    <div>Level: {position.level}</div>
                                                    <div>Position: {position.name}</div>
                                                    <div>Bay: {bay.bay}</div>
                                                    <div>Row: {row.row}</div>
                                                  </div>
                                                </div>
                                              </TooltipContent>
                                            )}
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseStructure;
