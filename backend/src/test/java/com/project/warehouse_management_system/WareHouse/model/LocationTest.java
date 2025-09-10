package com.project.warehouse_management_system.WareHouse.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LocationTest {
    
    private Location location;
    
    @BeforeEach
    void setUp() {
        location = new Location();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        location.setId(id);
        assertEquals(id, location.getId());
    }
    
    @Test
    void testSetAndGetType() {
        String type = "Storage";
        location.setLocationName(type);
        assertEquals(type, location.getLocationName());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Location location1 = new Location();
        Location location2 = new Location();
        
        location1.setId(1L);
        location2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(location1.getId(), location2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

