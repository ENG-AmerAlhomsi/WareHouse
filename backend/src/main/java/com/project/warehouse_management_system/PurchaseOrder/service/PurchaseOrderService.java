package com.project.warehouse_management_system.PurchaseOrder.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.PurchaseOrder.model.PurchaseOrder;
import com.project.warehouse_management_system.PurchaseOrder.repo.PurchaseOrderRepo;
import com.project.warehouse_management_system.Inventory.model.Pallet;
import com.project.warehouse_management_system.Inventory.model.Product;
import com.project.warehouse_management_system.Inventory.repo.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.text.SimpleDateFormat;

@Service
public class PurchaseOrderService extends BaseService<PurchaseOrder, Long> {

    @Autowired
    private PurchaseOrderRepo purchaseOrderRepo;
    
    @Autowired
    private ProductRepo productRepo;

    @Override
    protected void setEntityId(PurchaseOrder entity, Long id) {
        entity.setId(id);
    }

    /**
     * Get all purchase orders for a specific supplier by user ID
     * Same pattern as getCustomerOrders in OrderService
     */
    public List<PurchaseOrder> getSupplierPurchaseOrders(String userId) {
        return purchaseOrderRepo.findByUserId(userId);
    }

    /**
     * Get purchase orders by status
     */
    public List<PurchaseOrder> getPurchaseOrdersByStatus(String status) {
        return purchaseOrderRepo.findByStatus(status);
    }

    /**
     * Get purchase orders for a specific supplier filtered by status
     */
    public List<PurchaseOrder> getSupplierPurchaseOrdersByStatus(String userId, String status) {
        return purchaseOrderRepo.findByUserIdAndStatus(userId, status);
    }

    /**
     * Update purchase order status
     */
    public PurchaseOrder updatePurchaseOrderStatus(Long id, String status) {
        PurchaseOrder purchaseOrder = purchaseOrderRepo.getPurchaseOrderById(id);
        if (purchaseOrder != null) {
            purchaseOrder.setStatus(status);
            return purchaseOrderRepo.save(purchaseOrder);
        }
        throw new RuntimeException("Purchase order not found with id: " + id);
    }

    /**
     * Add pallet to purchase order
     */
    public PurchaseOrder addPalletToPurchaseOrder(Long purchaseOrderId, Map<String, Object> palletData) {
        PurchaseOrder purchaseOrder = purchaseOrderRepo.getPurchaseOrderById(purchaseOrderId);
        if (purchaseOrder == null) {
            throw new RuntimeException("Purchase order not found with id: " + purchaseOrderId);
        }
        
        // Create new Pallet entity from the map data
        Pallet pallet =  new Pallet();
        
        // Set basic pallet fields
        pallet.setPalletName((String) palletData.get("palletName"));
        pallet.setQuantity(((Number) palletData.get("quantity")).intValue());
        pallet.setMaximumCapacity(((Number) palletData.get("maximumCapacity")).intValue());
        pallet.setStatus((String) palletData.get("status"));
        pallet.setSupplierName((String) palletData.get("supplierName"));
        
        // Handle dates
        try {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            String manufacturingDateStr = (String) palletData.get("manufacturingDate");
            String expiryDateStr = (String) palletData.get("expiryDate");
            
            if (manufacturingDateStr != null) {
                pallet.setManufacturingDate(dateFormat.parse(manufacturingDateStr));
            }
            if (expiryDateStr != null) {
                pallet.setExpiryDate(dateFormat.parse(expiryDateStr));
            }
        } catch (Exception e) {
            throw new RuntimeException("Invalid date format. Expected yyyy-MM-dd");
        }
        
        // Set the product entity using productId
        Object productIdObj = palletData.get("productId");
        if (productIdObj != null) {
            Long productId = ((Number) productIdObj).longValue();
            Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
            pallet.setProduct(product);
        } else {
            throw new RuntimeException("Product ID is required");
        }
        
        // Set the purchase order reference in the pallet
        pallet.setPurchaseOrder(purchaseOrder);
        
        // Add the pallet to the purchase order's pallet list
        purchaseOrder.getPallets().add(pallet);
        
        // Save the updated purchase order
        return purchaseOrderRepo.save(purchaseOrder);
    }
}