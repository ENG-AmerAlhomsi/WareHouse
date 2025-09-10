package com.project.warehouse_management_system.Inventory.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PaymentInfoTest {
    
    private PaymentInfo paymentInfo;
    
    @BeforeEach
    void setUp() {
        paymentInfo = new PaymentInfo();
    }

    
    @Test
    void testSetAndGetPaymentMethod() {
        String paymentMethod = "Credit Card";
        paymentInfo.setLast4(paymentMethod);
        assertEquals(paymentMethod, paymentInfo.getLast4());
    }


}
