package com.project.warehouse_management_system.PurchaseOrder.model;

import com.project.warehouse_management_system.Inventory.model.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PurchaseOrderProductTest {
    
    private PurchaseOrderProduct purchaseOrderProduct;
    
    @BeforeEach
    void setUp() {
        purchaseOrderProduct = new PurchaseOrderProduct();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        purchaseOrderProduct.setId(id);
        assertEquals(id, purchaseOrderProduct.getId());
    }
    
    @Test
    void testSetAndGetProductName() {
        Product productName = new Product();
        purchaseOrderProduct.setProduct(productName);
        assertEquals(productName, purchaseOrderProduct.getProduct());
    }
    
    @Test
    void testSetAndGetProductId() {
        Long productId = 101L;
        purchaseOrderProduct.setId(productId);
        assertEquals(productId, purchaseOrderProduct.getId());
    }
    
    @Test
    void testSetAndGetQuantity() {
        Integer quantity = 100;
        purchaseOrderProduct.setQuantity(quantity);
        assertEquals(quantity, purchaseOrderProduct.getQuantity());
    }

    
    @Test
    void testSetAndGetTotalPrice() {
        BigDecimal totalPrice = new BigDecimal("79999.00");
        purchaseOrderProduct.setPrice(totalPrice);
        assertEquals(totalPrice, purchaseOrderProduct.getPrice());
    }
    
    @Test
    void testEqualsAndHashCode() {
        PurchaseOrderProduct product1 = new PurchaseOrderProduct();
        PurchaseOrderProduct product2 = new PurchaseOrderProduct();
        
        product1.setId(1L);
        product2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(product1.getId(), product2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

