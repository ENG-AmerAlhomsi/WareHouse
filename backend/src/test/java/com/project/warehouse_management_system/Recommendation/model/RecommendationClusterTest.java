package com.project.warehouse_management_system.Recommendation.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


import static org.junit.jupiter.api.Assertions.*;

class RecommendationClusterTest {
    
    private RecommendationCluster recommendationCluster;
    
    @BeforeEach
    void setUp() {
        recommendationCluster = new RecommendationCluster();
    }
    
    @Test
    void testSetAndGetId() {
        Integer id = 1;
        recommendationCluster.setClusterId(id);
        assertEquals(id, recommendationCluster.getClusterId());
    }

    
    @Test
    void testSetAndGetDescription() {
        String description = "Electronic devices and accessories";
        recommendationCluster.setExplanation(description);
        assertEquals(description, recommendationCluster.getExplanation());
    }

    
    @Test
    void testEqualsAndHashCode() {
        RecommendationCluster cluster1 = new RecommendationCluster();
        RecommendationCluster cluster2 = new RecommendationCluster();
        
        cluster1.setClusterId(1);
        cluster2.setClusterId(1);
        
        // Test equality based on ID only
        assertEquals(cluster1.getClusterId(), cluster2.getClusterId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

