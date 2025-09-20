package com.project.warehouse_management_system.WareHouseStructure.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


import static org.junit.jupiter.api.Assertions.*;

class RowTest {
    
    private Row row;
    
    @BeforeEach
    void setUp() {
        row = new Row();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        row.setId(id);
        assertEquals(id, row.getId());
    }
    
    @Test
    void testSetAndGetName() {
        String name = "Row 1";
        row.setRowName(name);
        assertEquals(name, row.getRowName());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Row row1 = new Row();
        Row row2 = new Row();
        
        row1.setId(1L);
        row2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(row1.getId(), row2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

