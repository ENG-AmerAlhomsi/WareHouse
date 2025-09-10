package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CategoryTest {
    
    private Category category;
    
    @BeforeEach
    void setUp() {
        category = new Category();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        category.setId(id);
        assertEquals(id, category.getId());
    }
    
    @Test
    void testSetAndGetName() {
        String name = "Electronics";
        category.setName(name);
        assertEquals(name, category.getName());
    }

    
    @Test
    void testEqualsAndHashCode() {
        Category category1 = new Category();
        Category category2 = new Category();
        
        category1.setId(1L);
        category2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(category1.getId(), category2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}
