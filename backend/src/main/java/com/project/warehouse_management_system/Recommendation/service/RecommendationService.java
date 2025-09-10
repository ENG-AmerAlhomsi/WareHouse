package com.project.warehouse_management_system.Recommendation.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.Recommendation.model.RecommendationCluster;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@Transactional(readOnly = true)
public class RecommendationService extends BaseService<RecommendationCluster, Integer> {
@Override
    protected void setEntityId(RecommendationCluster entity, Integer integer) {

    }
}