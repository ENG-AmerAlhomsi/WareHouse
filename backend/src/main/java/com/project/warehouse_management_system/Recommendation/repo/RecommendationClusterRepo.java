package com.project.warehouse_management_system.Recommendation.repo;

import com.project.warehouse_management_system.BaseClasses.BaseRepo;
import com.project.warehouse_management_system.Recommendation.model.RecommendationCluster;
import org.springframework.stereotype.Repository;

@Repository
public interface RecommendationClusterRepo extends BaseRepo<RecommendationCluster, Integer> {
}