package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ShippingAddressTest {
    
    private ShippingAddress shippingAddress;
    
    @BeforeEach
    void setUp() {
        shippingAddress = new ShippingAddress();
    }

    
    @Test
    void testSetAndGetStreet() {
        String street = "123 Main St";
        shippingAddress.setAddress(street);
        assertEquals(street, shippingAddress.getAddress());
    }
    
    @Test
    void testSetAndGetCity() {
        String city = "New York";
        shippingAddress.setCity(city);
        assertEquals(city, shippingAddress.getCity());
    }
    
    @Test
    void testSetAndGetState() {
        String state = "NY";
        shippingAddress.setState(state);
        assertEquals(state, shippingAddress.getState());
    }
    
    @Test
    void testSetAndGetZipCode() {
        String zipCode = "10001";
        shippingAddress.setZipCode(zipCode);
        assertEquals(zipCode, shippingAddress.getZipCode());
    }

}
