package com.project.warehouse_management_system.Inventory.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Setter
@Getter
public class ShippingAddress {

    private String address;
    private String city;
    private String state;
    private String zipCode;
}
