package com.project.warehouse_management_system.Inventory.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Setter
@Getter
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "Product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    private double weight;

    private int quantityInStock;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    private String batchNumber;

    @ManyToOne
    private Category category;

    private String imageUrl;

    @CreatedDate
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "last_modified",insertable = false)
    private LocalDateTime lastModified;

    private boolean isActive;

//    @JsonIgnore
//    @BatchSize(size = 30)
//    @OneToMany
//    @JoinColumn(name = "product_id")
//    private List<OrderProduct> Products=new ArrayList<>() ;
}
