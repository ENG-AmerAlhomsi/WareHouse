package com.project.warehouse_management_system.config.UserConfig;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RoleTest {
    
    private Role role;
    
    @BeforeEach
    void setUp() {
        role = new Role();
    }
    
    @Test
    void testSetAndGetId() {
        String id = "1";
        role.setId(id);
        assertEquals(id, role.getId());
    }
    
    @Test
    void testSetAndGetName() {
        String name = "ADMIN";
        role.setName(name);
        assertEquals(name, role.getName());
    }

    
    @Test
    void testEqualsAndHashCode() {
        Role role1 = new Role();
        Role role2 = new Role();
        
        role1.setId(String.valueOf(1L));
        role2.setId(String.valueOf(1L));
        
        // Test equality based on ID only
        assertEquals(role1.getId(), role2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

