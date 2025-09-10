package com.project.warehouse_management_system.Recommendation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Setter
@Getter
@Entity
@Table(name = "recommendation_products")
public class RecommendationProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "cluster_id", nullable = false)
    @JsonBackReference
    private RecommendationCluster cluster;

    @Column(name = "stock_code", nullable = false)
    private String stockCode;

    @Column(name = "description")
    private String description;

    @Column(name = "quantity")
    private Integer quantity;

}