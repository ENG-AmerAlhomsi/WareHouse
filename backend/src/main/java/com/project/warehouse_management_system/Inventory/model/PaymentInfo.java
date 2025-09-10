package com.project.warehouse_management_system.Inventory.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Setter
@Getter
public class PaymentInfo {
    private String last4;

}
