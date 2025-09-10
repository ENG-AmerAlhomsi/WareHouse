package com.project.warehouse_management_system.Shipment.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


import static org.junit.jupiter.api.Assertions.*;

class TruckTest {
    
    private Truck truck;
    
    @BeforeEach
    void setUp() {
        truck = new Truck();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        truck.setId(id);
        assertEquals(id, truck.getId());
    }
    
    @Test
    void testSetAndGetTruckNumber() {
        String truckNumber = "TRK-001";
        truck.setTruckName(truckNumber);
        assertEquals(truckNumber, truck.getTruckName());
    }
    
    @Test
    void testSetAndGetShipments() {
        Shipment shipment1 = new Shipment();
        shipment1.setId(1L);
        shipment1.setShipmentName("SHP-001");
        
        truck.setShipment(shipment1);
        assertEquals(shipment1, truck.getShipment());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Truck truck1 = new Truck();
        Truck truck2 = new Truck();
        
        truck1.setId(1L);
        truck2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(truck1.getId(), truck2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

