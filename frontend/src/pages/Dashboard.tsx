import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Truck, 
  ClipboardList, 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from "lucide-react";
import { 
  productApi, 
  orderApi, 
  shipmentApi, 
  palletApi, 
  areaApi,
  positionApi 
} from "@/services/api";
import { Product } from "@/types/Inventory";
import { Order } from "@/types/order";
import { Shipment, Area, Position } from "@/types/warehouse";

const Dashboard = () => {
  // State for all dashboard data
  const [metrics, setMetrics] = useState({
    totalInventory: { value: "0" },
    pendingOrders: { value: "0" },
    activeShipments: { value: "0"},
    lowStockItems: { value: "0"}
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [areaUtilization, setAreaUtilization] = useState<{[key: string]: number}>({});
  const [recentActivities, setRecentActivities] = useState<{id: number, activity: string, time: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all necessary data
        const [productsRes, ordersRes, shipmentsRes, positionsRes, areasRes] = await Promise.all([
          productApi.getAll(),
          orderApi.getAll(),
          shipmentApi.getAll(),
          positionApi.getAll(),
          areaApi.getAll()
        ]);

        const productsData = productsRes.data;
        const ordersData = ordersRes.data;
        const shipmentsData = shipmentsRes.data;
        const positionsData = positionsRes.data;
        const areasData = areasRes.data;

        setProducts(productsData);
        setOrders(ordersData);
        setShipments(shipmentsData);
        setAreas(areasData);
        setPositions(positionsData);

        // Calculate metrics
        const totalInventory = productsData.reduce((sum, product) => sum + product.quantityInStock, 0);
        const pendingOrders = ordersData.filter(order => order.status === "Pending").length;
        const activeShipments = shipmentsData.filter(shipment => 
          shipment.statusName === "In Transit" || shipment.statusName === "PROCESSING"
        ).length;
        const lowStockItems = productsData.filter(product => product.quantityInStock < 10).length;

        // Calculate area utilization
        const areaUtilizationData = calculateAreaUtilization(areasData, positionsData);
        setAreaUtilization(areaUtilizationData);

        // Generate recent activities from orders and shipments
        const activities = [];
        
        // Add recent order activities
        ordersData.slice(0, 3).forEach((order, index) => {
          activities.push({
            id: index,
            activity: `Order #${order.id} ${order.status === "COMPLETED" ? "was completed" : "status updated to " + order.status}`,
            time: formatTimeAgo(new Date(order.date))
          });
        });
        
        // Add recent shipment activities
        shipmentsData.slice(0, 3).forEach((shipment, index) => {
          activities.push({
            id: index + 3,
            activity: `Shipment ${shipment.shipmentName} status: ${shipment.statusName}`,
            time: formatTimeAgo(shipment.lastModified ? new Date(shipment.lastModified) : new Date())
          });
        });
        
        // Sort by most recent
        activities.sort((a, b) => {
          return timeStringToMinutes(b.time) - timeStringToMinutes(a.time);
        });

        setRecentActivities(activities.slice(0, 5));

        // Update metrics with calculated values and changes
        setMetrics({
          totalInventory: { 
            value: totalInventory.toString()
          },
          pendingOrders: { 
            value: pendingOrders.toString()
          },
          activeShipments: { 
            value: activeShipments.toString()
          },
          lowStockItems: { 
            value: lowStockItems.toString()
          }
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate area utilization based on positions
  const calculateAreaUtilization = (areas: Area[], positions: Position[]): {[key: string]: number} => {
    const areaUtilization: {[key: string]: number} = {};
    const areaPositionsMap: {[key: string]: {total: number, occupied: number}} = {};
    
    if (!areas?.length || !positions?.length) {
      return {};
    }
    
    // Initialize area map
    areas.forEach(area => {
      areaPositionsMap[area.areaName] = {
        total: 0,
        occupied: 0
      };
    });
    
    // Count positions for each area
    positions.forEach(position => {
      if (position && position.bay && position.bay.row_sy && position.bay.row_sy.area) {
        const areaName = position.bay.row_sy.area.areaName;
        
        if (areaPositionsMap[areaName]) {
          // Increment total positions for this area
          areaPositionsMap[areaName].total += 1;
          
          // Check if position is occupied (not empty)
          if (position.isEmpty === false) {
            areaPositionsMap[areaName].occupied += 1;
          }
        }
      }
    });
    
    // Calculate percentages
    Object.keys(areaPositionsMap).forEach(areaName => {
      const areaData = areaPositionsMap[areaName];
      if (areaData.total > 0) {
        const percentage = Math.round((areaData.occupied / areaData.total) * 100);
        areaUtilization[areaName] = percentage;
      } else {
        areaUtilization[areaName] = 0;
      }
    });
    
    return areaUtilization;
  };

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  // Helper to convert time strings to minutes for sorting
  const timeStringToMinutes = (timeString) => {
    if (timeString.includes('minutes')) {
      return parseInt(timeString);
    } else if (timeString.includes('hours')) {
      return parseInt(timeString) * 60;
    } else if (timeString.includes('days')) {
      return parseInt(timeString) * 60 * 24;
    }
    return 0;
  };

  const metricItems = [
    {
      title: "Total Inventory",
      value: metrics.totalInventory.value,
      icon: Package
    },
    {
      title: "Pending Orders",
      value: metrics.pendingOrders.value,
      icon: ClipboardList
    },
    {
      title: "Active Shipments",
      value: metrics.activeShipments.value,
      icon: Truck
    },
    {
      title: "Low Stock Items",
      value: metrics.lowStockItems.value,
      icon: AlertTriangle
    },
  ];

  // Get upcoming deliveries from pending orders
  const upcomingDeliveries = orders
    .filter(order => order.status === "PROCESSING" || order.status === "SHIPPED")
    .slice(0, 3)
    .map(order => ({
      id: order.id,
      expectedDate: order.date ? new Date(order.date) : new Date(),
      status: order.status === "SHIPPED" ? "On Time" : "Processing"
    }));

  // Get inventory alerts from low stock items
  const inventoryAlerts = products
    .filter(product => product.quantityInStock < 10)
    .slice(0, 3)
    .map(product => ({
      id: product.id,
      name: product.name,
      sku: `SKU-${product.id}`,
      status: product.quantityInStock < 5 ? "Low Stock" : "Reorder Soon"
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Yellow Brick Warehouse Management System
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((metric, index) => (
          <Card key={index} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 card-hover">
          <CardHeader>
            <CardTitle className="text-xl">Warehouse Space Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(areaUtilization).map(([areaName, percentage]) => (
                <div key={areaName}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{areaName}</div>
                    <div className="text-sm font-medium">{percentage}%</div>
                  </div>
                  <Progress value={percentage} className="mt-2 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm">{activity.activity}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Upcoming Deliveries</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeliveries.length > 0 ? (
                upcomingDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Order #{delivery.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Expected: {delivery.expectedDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-sm py-1 px-2 rounded-full ${
                      delivery.status === "On Time"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {delivery.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No upcoming deliveries</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Inventory Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((alert) => (
                  <div key={alert.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{alert.sku}</p>
                      <p className="text-sm text-muted-foreground">{alert.name}</p>
                    </div>
                    <div className={`text-sm py-1 px-2 rounded-full ${
                      alert.status === "Low Stock"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {alert.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No inventory alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
