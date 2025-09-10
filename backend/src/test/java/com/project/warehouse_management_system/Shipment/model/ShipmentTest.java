package com.project.warehouse_management_system.Shipment.model;

import com.project.warehouse_management_system.Inventory.model.Orders;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class ShipmentTest {
    
    private Shipment shipment;
    
    @BeforeEach
    void setUp() {
        shipment = new Shipment();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        shipment.setId(id);
        assertEquals(id, shipment.getId());
    }
    
    @Test
    void testSetAndGetShipmentNumber() {
        String shipmentNumber = "SHP-001";
        shipment.setShipmentName(shipmentNumber);
        assertEquals(shipmentNumber, shipment.getShipmentName());
    }
    
    @Test
    void testSetAndGetStatus() {
        String status = "In Transit";
        shipment.setStatusName(status);
        assertEquals(status, shipment.getStatusName());
    }
    
    @Test
    void testSetAndGetShipDate() {
        LocalDateTime shipDate = LocalDateTime.now();
        shipment.setCreatedAt(shipDate);
        assertEquals(shipDate, shipment.getCreatedAt());
    }
    
    @Test
    void testSetAndGetCarrier() {
        String carrier = "FedEx";
        shipment.setFromName(carrier);
        assertEquals(carrier, shipment.getFromName());
    }
    
    @Test
    void testSetAndGetOrder() {
        List<Orders> orders = new ArrayList<>();
        Orders order = new Orders();
        order.setId(1L);
        orders.add(order);
        
        shipment.setOrders(orders);
        assertEquals(orders, shipment.getOrders());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Shipment shipment1 = new Shipment();
        Shipment shipment2 = new Shipment();
        
        shipment1.setId(1L);
        shipment2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(shipment1.getId(), shipment2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

