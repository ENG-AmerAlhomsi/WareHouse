export interface RecommendationCluster {
  clusterId: number;
  coherenceScore: number;
  recommendationStrength: number;
  totalQuantitySold: number;
  avgUnitPrice: number;
  explanation: string;
  createdAt: string;
  products: RecommendationProduct[];
}

export interface RecommendationProduct {
  id: number;
  stockCode: string;
  description: string;
  quantity: number;
}