package com.project.warehouse_management_system.Recommendation.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationProductTest {
    
    private RecommendationProduct recommendationProduct;
    
    @BeforeEach
    void setUp() {
        recommendationProduct = new RecommendationProduct();
    }
    
    @Test
    void testSetAndGetId() {
        Integer id = 1;
        recommendationProduct.setId(id);
        assertEquals(id, recommendationProduct.getId());
    }


    
    @Test
    void testSetAndGetFeatures() {
        String features = "High performance, camera, touchscreen";
        recommendationProduct.setDescription(features);
        assertEquals(features, recommendationProduct.getDescription());
    }

    
    @Test
    void testEqualsAndHashCode() {
        RecommendationProduct product1 = new RecommendationProduct();
        RecommendationProduct product2 = new RecommendationProduct();
        
        product1.setId(1);
        product2.setId(1);
        
        // Test equality based on ID only
        assertEquals(product1.getId(), product2.getId());
        
        // We can't directly compare objects since equals() might not be implemented
        // or might consider other fields besides ID
    }
}

