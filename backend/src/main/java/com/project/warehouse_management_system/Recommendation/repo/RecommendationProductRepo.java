package com.project.warehouse_management_system.Recommendation.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import org.springframework.stereotype.Repository;

import com.project.warehouse_management_system.Recommendation.model.RecommendationProduct;

@Repository
public interface RecommendationProductRepo extends BaseRepo<RecommendationProduct, Integer> {
}