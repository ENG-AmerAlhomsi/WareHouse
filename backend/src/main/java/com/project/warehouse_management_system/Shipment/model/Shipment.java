package com.project.warehouse_management_system.Shipment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.warehouse_management_system.Inventory.model.Orders;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "shipment")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_name", nullable = false)
    private String shipmentName;

    @Column(name = "from_name", nullable = false)
    private String fromName;

    @Column(name = "to_name", nullable = false)
    private String toName;

    @Column(name = "shipping_employee", nullable = false)
    private String shippingEmployee;

    @Column(name = "type_name", nullable = false)
    private String typeName;

    @Column(name = "status_name", nullable = false)
    private String statusName;

    @OneToMany
    private List<Orders> orders = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonIgnore
    @Column(name = "last_modified",insertable = false)
    private LocalDateTime lastModified;
}
