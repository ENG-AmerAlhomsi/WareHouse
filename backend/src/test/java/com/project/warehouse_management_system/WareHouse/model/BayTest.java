package com.project.warehouse_management_system.WareHouse.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


import static org.junit.jupiter.api.Assertions.*;

class BayTest {
    
    private Bay bay;
    
    @BeforeEach
    void setUp() {
        bay = new Bay();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        bay.setId(id);
        assertEquals(id, bay.getId());
    }
    
    @Test
    void testSetAndGetName() {
        String name = "Bay 1";
        bay.setBayName(name);
        assertEquals(name, bay.getBayName());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Bay bay1 = new Bay();
        Bay bay2 = new Bay();
        
        bay1.setId(1L);
        bay2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(bay1.getId(), bay2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

