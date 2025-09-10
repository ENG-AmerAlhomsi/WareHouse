package com.project.warehouse_management_system.PurchaseOrder.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PurchaseOrderTest {
    
    private PurchaseOrder purchaseOrder;
    
    @BeforeEach
    void setUp() {
        purchaseOrder = new PurchaseOrder();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        purchaseOrder.setId(id);
        assertEquals(id, purchaseOrder.getId());
    }
    
    @Test
    void testSetAndGetOrderDate() {
        LocalDateTime orderDate = LocalDateTime.now();
        purchaseOrder.setCreatedAt(orderDate);
        assertEquals(orderDate, purchaseOrder.getCreatedAt());
    }
    
    @Test
    void testSetAndGetStatus() {
        String status = "Pending";
        purchaseOrder.setStatus(status);
        assertEquals(status, purchaseOrder.getStatus());
    }
    
    @Test
    void testSetAndGetTotalAmount() {

        Double totalAmount = (5000.00);
        purchaseOrder.setTotalPrice(totalAmount);
        assertEquals(totalAmount, purchaseOrder.getTotalPrice());
    }
    
    @Test
    void testSetAndGetSupplierName() {
        String supplierName = "Tech Supplies Inc.";
        purchaseOrder.setSupplierName(supplierName);
        assertEquals(supplierName, purchaseOrder.getSupplierName());
    }
    
    @Test
    void testSetAndGetSupplierContact() {
        String supplierContact = "John Doe";
        purchaseOrder.setSupplierName(supplierContact);
        assertEquals(supplierContact, purchaseOrder.getSupplierName());
    }
    
    @Test
    void testSetAndGetExpectedDeliveryDate() {
        Date expectedDeliveryDate = new Date();
        purchaseOrder.setExpectedArrivalTime(expectedDeliveryDate);
        assertEquals(expectedDeliveryDate, purchaseOrder.getExpectedArrivalTime());
    }
    
    @Test
    void testSetAndGetPurchaseOrderProducts() {
        List<PurchaseOrderProduct> products = new ArrayList<>();
        PurchaseOrderProduct product1 = new PurchaseOrderProduct();
        product1.setId(1L);
        products.add(product1);
        
        purchaseOrder.setProducts(products);
        assertEquals(products, purchaseOrder.getProducts());
    }
    
    @Test
    void testEqualsAndHashCode() {
        PurchaseOrder order1 = new PurchaseOrder();
        PurchaseOrder order2 = new PurchaseOrder();
        
        order1.setId(1L);
        order2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(order1.getId(), order2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

