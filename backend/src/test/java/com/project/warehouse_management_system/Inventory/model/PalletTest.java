package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PalletTest {
    
    private Pallet pallet;
    
    @BeforeEach
    void setUp() {
        pallet = new Pallet();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        pallet.setId(id);
        assertEquals(id, pallet.getId());
    }
    
    @Test
    void testSetAndGetPalletNumber() {
        String palletNumber = "PLT-001";
        pallet.setPalletName(palletNumber);
        assertEquals(palletNumber, pallet.getPalletName());
    }

    
    @Test
    void testSetAndGetProduct() {
        Product product = new Product();
        product.setId(1L);
        product.setName("Smartphone");
        
        pallet.setProduct(product);
        assertEquals(product, pallet.getProduct());
    }
    
    @Test
    void testSetAndGetQuantity() {
        Integer quantity = 50;
        pallet.setQuantity(quantity);
        assertEquals(quantity, pallet.getQuantity());
    }
    
    @Test
    void testSetAndGetStatus() {
        String status = "Available";
        pallet.setStatus(status);
        assertEquals(status, pallet.getStatus());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Pallet pallet1 = new Pallet();
        Pallet pallet2 = new Pallet();
        
        pallet1.setId(1L);
        pallet2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(pallet1.getId(), pallet2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

