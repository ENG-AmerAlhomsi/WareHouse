package com.project.warehouse_management_system.Recommendation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "recommendation_clusters")
public class RecommendationCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer clusterId;

    @Column(name = "coherence_score", nullable = false)
    private Float coherenceScore;

    @Column(name = "recommendation_strength", nullable = false)
    private Float recommendationStrength;

    @Column(name = "total_quantity_sold")
    private Integer totalQuantitySold;

    @Column(name = "avg_unit_price")
    private java.math.BigDecimal avgUnitPrice;

    @Column(name = "explanation")
    private String explanation;

    @OneToMany(mappedBy = "cluster", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<RecommendationProduct> products = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}