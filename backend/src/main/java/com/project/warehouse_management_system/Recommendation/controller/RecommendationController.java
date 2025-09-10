package com.project.warehouse_management_system.Recommendation.controller;

import com.project.warehouse_management_system.BaseClasses.BaseController;
import com.project.warehouse_management_system.Recommendation.model.RecommendationCluster;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController extends BaseController<RecommendationCluster, Integer> {

}