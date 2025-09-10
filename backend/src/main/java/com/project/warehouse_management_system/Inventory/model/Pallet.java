package com.project.warehouse_management_system.Inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.warehouse_management_system.PurchaseOrder.model.PurchaseOrder;
import com.project.warehouse_management_system.WareHouse.model.Position;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Date;

@Setter
@Getter
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "Pallet")
public class Pallet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pallet-name", nullable = false)
    private String palletName;

    private int quantity;

    private int maximumCapacity;

    private String status;

    private Date manufacturingDate;

    private Date expiryDate;

    private String supplierName;

    @OneToOne
    private Position position;

    @ManyToOne
    private Product product;

    @ManyToOne
    @JoinColumn(name = "purchase_order_id")
    @JsonIgnore
    private PurchaseOrder purchaseOrder;

    @CreatedDate
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonIgnore
    @Column(name = "last_modified",insertable = false)
    private LocalDateTime lastModified;
}
