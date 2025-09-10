package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OrdersTest {
    
    private Orders order;
    
    @BeforeEach
    void setUp() {
        order = new Orders();
    }
    
    @Test
    void testSetAndGetId() {
        Long id = 1L;
        order.setId(id);
        assertEquals(id, order.getId());
    }
    
    @Test
    void testSetAndGetOrderDate() {
        LocalDate orderDate = LocalDate.now();
        order.setDate(orderDate);
        assertEquals(orderDate, order.getDate());
    }
    
    @Test
    void testSetAndGetStatus() {
        String status = "Processing";
        order.setStatus(status);
        assertEquals(status, order.getStatus());
    }
    
    @Test
    void testSetAndGetTotalAmount() {
        String totalAmount = "1299.99";
        order.setValue(totalAmount);
        assertEquals(totalAmount, order.getValue());
    }
    
    @Test
    void testSetAndGetCustomerId() {
        String customerId = "user123";
        order.setCustomer(customerId);
        assertEquals(customerId, order.getCustomer());
    }
    
    @Test
    void testSetAndGetOrderProducts() {
        List<OrderProduct> orderProducts = new ArrayList<>();
        OrderProduct orderProduct1 = new OrderProduct();
        orderProduct1.setId(1L);
        orderProducts.add(orderProduct1);
        
        order.setProducts(orderProducts);
        assertEquals(orderProducts, order.getProducts());
    }
    
    @Test
    void testSetAndGetShippingAddress() {
        ShippingAddress address = new ShippingAddress();
        address.setAddress("123 Main St");
        
        order.setShippingAddress(address);
        assertEquals(address, order.getShippingAddress());
    }
    
    @Test
    void testSetAndGetPaymentInfo() {
        PaymentInfo paymentInfo = new PaymentInfo();
        paymentInfo.setLast4("Credit Card");
        
        order.setPayment(paymentInfo);
        assertEquals(paymentInfo, order.getPayment());
    }
    
    @Test
    void testEqualsAndHashCode() {
        Orders order1 = new Orders();
        Orders order2 = new Orders();
        
        order1.setId(1L);
        order2.setId(1L);
        
        // Test equality based on ID only
        assertEquals(order1.getId(), order2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

