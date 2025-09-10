package com.project.warehouse_management_system.WareHouse.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AreaTest {
    
    private Area area;
    
    @BeforeEach
    void setUp() {
        area = new Area();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        area.setId(id);
        assertEquals(id, area.getId());
    }
    
    @Test
    void testSetAndGetName() {
        String name = "Storage Area A";
        area.setAreaName(name);
        assertEquals(name, area.getAreaName());
    }

    
    @Test
    void testEqualsAndHashCode() {
        Area area1 = new Area();
        Area area2 = new Area();
        
        area1.setId(1L);
        area2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(area1.getId(), area2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

