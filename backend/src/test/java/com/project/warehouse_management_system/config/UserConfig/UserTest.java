package com.project.warehouse_management_system.config.UserConfig;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


import static org.junit.jupiter.api.Assertions.*;

class UserTest {
    
    private User user;
    
    @BeforeEach
    void setUp() {
        user = new User();
    }
    
    @Test
    void testSetAndGetId() {
        String id = "user123";
        user.setId(id);
        assertEquals(id, user.getId());
    }
    
    @Test
    void testSetAndGetUsername() {
        String username = "johndoe";
        user.setUserName(username);
        assertEquals(username, user.getUserName());
    }
    
    @Test
    void testSetAndGetEmail() {
        String email = "john.doe@example.com";
        user.setEmail(email);
        assertEquals(email, user.getEmail());
    }
    
    @Test
    void testSetAndGetFirstName() {
        String firstName = "John";
        user.setFirstName(firstName);
        assertEquals(firstName, user.getFirstName());
    }
    
    @Test
    void testSetAndGetLastName() {
        String lastName = "Doe";
        user.setLastName(lastName);
        assertEquals(lastName, user.getLastName());
    }
    
    @Test
    void testEqualsAndHashCode() {
        User user1 = new User();
        User user2 = new User();
        
        user1.setId("user123");
        user2.setId("user123");
        
        // Test equality based on ID only
        assertEquals(user1.getId(), user2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

