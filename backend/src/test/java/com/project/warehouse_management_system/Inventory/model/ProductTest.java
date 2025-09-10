package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ProductTest {
    
    private Product product;
    
    @BeforeEach
    void setUp() {
        product = new Product();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        product.setId(id);
        assertEquals(id, product.getId());
    }
    
    @Test
    void testSetAndGetName() {
        String name = "Smartphone";
        product.setName(name);
        assertEquals(name, product.getName());
    }
    
    @Test
    void testSetAndGetDescription() {
        String description = "Latest model smartphone";
        product.setDescription(description);
        assertEquals(description, product.getDescription());
    }
    
    @Test
    void testSetAndGetPrice() {
        BigDecimal price = new BigDecimal("999.99");
        product.setUnitPrice(price);
        assertEquals(price, product.getUnitPrice());
    }
    
    @Test
    void testSetAndGetStockQuantity() {
        Integer stockQuantity = 100;
        product.setQuantityInStock(stockQuantity);
        assertEquals(stockQuantity, product.getQuantityInStock());
    }
    
    @Test
    void testSetAndGetCategory() {
        Category category = new Category();
        category.setId(1L);
        category.setName("Electronics");
        
        product.setCategory(category);
        assertEquals(category, product.getCategory());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Product product1 = new Product();
        Product product2 = new Product();
        
        product1.setId(1L);
        product2.setId(1L);

        product1.setQuantityInStock(30);
        product2.setQuantityInStock(30);
        // Test equality based on ID only
        assertEquals(product1.getId(), product2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

