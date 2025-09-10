package com.project.warehouse_management_system.PurchaseOrder.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.warehouse_management_system.Inventory.model.Pallet;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Setter
@Getter
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "purchase_orders")
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String supplierName;

    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private Date expectedArrivalTime;

    @Column(nullable = false)
    private Double totalPrice;

    @Column(nullable = false)
    private String status = "Pending"; // Pending, Processing, Ready to Ship, Shipping, QQ CHECK, Complete, Rejected

    @OneToMany(targetEntity = PurchaseOrderProduct.class, cascade = CascadeType.ALL)
    @JoinColumn(name = "purchase_order_id", referencedColumnName = "id")
    private List<PurchaseOrderProduct> products = new ArrayList<>();

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL)
    private List<Pallet> pallets = new ArrayList<>();

    @Column(length = 1000)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonIgnore
    @Column(name = "last_modified", insertable = false)
    private LocalDateTime lastModified;
}