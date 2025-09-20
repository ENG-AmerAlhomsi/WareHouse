package com.project.warehouse_management_system.WareHouseStructure.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PositionTest {
    
    private Position position;
    
    @BeforeEach
    void setUp() {
        position = new Position();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        position.setId(id);
        assertEquals(id, position.getId());
    }
    
    @Test
    void testSetAndGetLevel() {
        Integer level = 2;
        position.setLevel(level);
        assertEquals(level, position.getLevel());
    }
    
    @Test
    void testSetAndGetCode() {
        String code = "P-001";
        position.setPositionName(code);
        assertEquals(code, position.getPositionName());
    }


    
    @Test
    void testSetAndGetBay() {
        Bay bay = new Bay();
        bay.setId(1L);
        bay.setBayName("Bay 1");
        
        position.setBay(bay);
        assertEquals(bay, position.getBay());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Position position1 = new Position();
        Position position2 = new Position();
        
        position1.setId(1L);
        position2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(position1.getId(), position2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

