import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AreaManagement from "@/components/warehouse/AreaManagement";
import RowManagement from "@/components/warehouse/RowManagement";
import BayManagement from "@/components/warehouse/BayManagement";
import PositionManagement from "@/components/warehouse/PositionManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, Row, Bay, Position } from "@/types/warehouse";
import { Pallet } from "@/types/Inventory";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Warehouse Structure Management</h1>
        <p className="text-muted-foreground">
          Manage your warehouse areas, rows, bays, and positions
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={handlePrintAll} disabled={downloading}>
            {downloading ? 'Preparing…' : 'Print All'}
          </Button>
          <Button variant="secondary" onClick={handlePrintNew} disabled={downloading}>
            {downloading ? 'Preparing…' : 'Print New'}
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouseStructure.map((area, index) => (
                <Card key={index} className="card-hover">
                  <CardHeader>
                    <CardTitle>Area {area.area}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {area.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="mb-4">
                        <h4 className="font-semibold mb-2">Row {row.row}</h4>
                        {row.bays.map((bay, bayIndex) => (
                          <div key={bayIndex} className="mb-3">
                            <div className="text-sm font-medium mb-1">Bay {bay.bay}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {bay.positions.map((position, posIndex) => {
                                const levelColors = getLevelColor(position.level);
                                const positionClass = position.isEmpty 
                                  ? 'bg-gray-100 border border-gray-300 text-gray-800' 
                                  : `${levelColors.bg} border ${levelColors.border} ${levelColors.text}`;
                                  
                                return (
                                  <TooltipProvider key={posIndex}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className={`p-3 rounded-md min-w-[150px] ${positionClass}`}>
                                          <div className="flex justify-between items-center">
                                            <span className={`text-sm font-medium ${!position.isEmpty ? levelColors.text : ''}`}>
                                              Pos {position.name}
                                            </span>
                                            <Badge className={position.isEmpty 
                                              ? 'bg-gray-500' 
                                              : `bg-opacity-80 ${position.level === 1 ? 'bg-yellow-200 text-black' : 
                                                 position.level === 2 ? 'bg-purple-200 text-black' : 
                                                 position.level === 3 ? 'bg-blue-200 text-black' : 
                                                 position.level === 4 ? 'bg-green-200 text-black' : 
                                                 'bg-red-200 text-black'}`}>
                                              {position.isEmpty ? 'Empty' : 'Occupied'}
                                            </Badge>
                                          </div>
                                          <div className={`text-sm mt-1 ${!position.isEmpty ? levelColors.text : ''}`}>
                                            Level: {position.level}
                                          </div>
                                          {!position.isEmpty && position.productInfo && (
                                            <div className={`mt-1 text-sm font-medium truncate ${levelColors.text}`}>
                                              {position.productInfo.productName.substring(0, 15)}
                                              {position.productInfo.productName.length > 15 ? '...' : ''}
                                            </div>
                                          )}
                                          {!position.isEmpty && position.productInfo && (
                                            <div className={`mt-1 text-xs ${levelColors.text}`}>
                                              Qty: {position.productInfo.quantity}
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      {!position.isEmpty && position.productInfo && (
                                        <TooltipContent>
                                          <div className="p-2">
                                            <p className="font-bold">{position.productInfo.productName}</p>
                                            <p>Quantity: {position.productInfo.quantity}</p>
                                            <p>Level: {position.level}</p>
                                          </div>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseStructure;
