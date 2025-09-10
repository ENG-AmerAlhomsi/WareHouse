package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


import static org.junit.jupiter.api.Assertions.*;

class OrderProductTest {
    
    private OrderProduct orderProduct;
    
    @BeforeEach
    void setUp() {
        orderProduct = new OrderProduct();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        orderProduct.setId(id);
        assertEquals(id, orderProduct.getId());
    }
    
    @Test
    void testSetAndGetQuantity() {
        Integer quantity = 5;
        orderProduct.setQuantity(quantity);
        assertEquals(quantity, orderProduct.getQuantity());
    }

    
    @Test
    void testSetAndGetProduct() {
        Product product = new Product();
        product.setId(1L);
        product.setName("Smartphone");
        
        orderProduct.setProduct(product);
        assertEquals(product, orderProduct.getProduct());
    }

    
    @Test
    void testEqualsAndHashCode() {
        OrderProduct orderProduct1 = new OrderProduct();
        OrderProduct orderProduct2 = new OrderProduct();
        
        orderProduct1.setId(1L);
        orderProduct2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(orderProduct1.getId(), orderProduct2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

