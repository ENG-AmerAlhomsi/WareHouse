package com.project.warehouse_management_system.PurchaseOrder.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.PurchaseOrder.model.PurchaseOrder;
import com.project.warehouse_management_system.PurchaseOrder.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/purchase-orders")
public class PurchaseOrderController extends BaseController<PurchaseOrder, Long> {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @PutMapping("update/{id}/status")
    @Operation(summary = "Update purchase order status")
    public ResponseEntity<PurchaseOrder> updatePurchaseOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            PurchaseOrder updatedOrder = purchaseOrderService.updatePurchaseOrderStatus(id, status);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get purchase orders by user ID - for supplier dashboard")
    public ResponseEntity<List<PurchaseOrder>> getSupplierPurchaseOrders(@PathVariable String userId) {
        List<PurchaseOrder> orders = purchaseOrderService.getSupplierPurchaseOrders(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/user/{userId}/status/{status}")
    @Operation(summary = "Get purchase orders by user ID and status - for supplier filtered tabs")
    public ResponseEntity<List<PurchaseOrder>> getSupplierPurchaseOrdersByStatus(
            @PathVariable String userId, 
            @PathVariable String status) {
        List<PurchaseOrder> orders = purchaseOrderService.getSupplierPurchaseOrdersByStatus(userId, status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get purchase orders by status - for supply manager filtered tabs")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrdersByStatus(@PathVariable String status) {
        List<PurchaseOrder> orders = purchaseOrderService.getPurchaseOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }

    @PostMapping("create/{id}/pallets")
    @Operation(summary = "Add pallet to purchase order - for supplier pallet creation")
    public ResponseEntity<PurchaseOrder> addPalletToPurchaseOrder(
            @PathVariable Long id,
            @RequestBody Map<String, Object> palletData) {
        try {
            PurchaseOrder updatedOrder = purchaseOrderService.addPalletToPurchaseOrder(id, palletData);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/stats/summary")
    @Operation(summary = "Get purchase order statistics summary for Supply Manager")
    public ResponseEntity<Object> getPurchaseOrderStats() {
        List<PurchaseOrder> allOrders = purchaseOrderService.getAll();
        
        long pendingCount = allOrders.stream().filter(po -> "Pending".equals(po.getStatus())).count();
        long processingCount = allOrders.stream().filter(po -> "Processing".equals(po.getStatus())).count();
        long shippingCount = allOrders.stream().filter(po -> "Shipping".equals(po.getStatus())).count();
        long qqCheckCount = allOrders.stream().filter(po -> "QQ CHECK".equals(po.getStatus())).count();
        long completeCount = allOrders.stream().filter(po -> "Complete".equals(po.getStatus())).count();
        long rejectedCount = allOrders.stream().filter(po -> "Rejected".equals(po.getStatus())).count();
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", allOrders.size());
        stats.put("pending", pendingCount);
        stats.put("processing", processingCount);
        stats.put("shipping", shippingCount);
        stats.put("qqCheck", qqCheckCount);
        stats.put("complete", completeCount);
        stats.put("rejected", rejectedCount);
        
        return ResponseEntity.ok(stats);
    }
}