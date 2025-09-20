package com.project.warehouse_management_system.Inventory.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.warehouse_management_system.PurchaseOrder.model.PurchaseOrder;
import com.project.warehouse_management_system.Shipment.model.Shipment;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Setter
@Getter
@EntityListeners(AuditingEntityListener.class)
@Table(name = "orders")
public class Orders {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customer;
    private LocalDate date;
    private Integer items;
    private String status;
    private String shipment;
    private String userId;
    private String value;

    @Embedded
    private ShippingAddress shippingAddress;

    @Embedded
    private PaymentInfo payment;

    @OneToMany(targetEntity = OrderProduct.class,cascade = CascadeType.ALL)
    @JoinColumn(name = "order_id",referencedColumnName = "id")
    private List<OrderProduct> products = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonIgnore
    @Column(name = "last_modified",insertable = false)
    private LocalDateTime lastModified;
}

