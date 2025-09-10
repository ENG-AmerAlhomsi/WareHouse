"""
Warehouse Recommendation System Package

This package provides a modular warehouse recommendation system based on
Agglomerative Hierarchical Clustering for product placement optimization.

Modules:
- database_handler: Database connection and data loading
- market_basket_analyzer: Market basket analysis and transformation
- similarity_calculator: Product similarity calculation
- clustering_analyzer: Hierarchical clustering analysis
- recommendation_generator: Recommendation generation
- visualization_helper: Visualization utilities
- warehouse_recommender_main: Main orchestrating class
"""

from .warehouse_recommender_main import WarehouseRecommendationSystem
from .database_handler import DatabaseHandler
from .market_basket_analyzer import MarketBasketAnalyzer
from .similarity_calculator import SimilarityCalculator
from .clustering_analyzer import ClusteringAnalyzer
from .recommendation_generator import RecommendationGenerator
from .visualization_helper import VisualizationHelper

__version__ = "1.0.0"
__author__ = "Warehouse Management Team"

__all__ = [
    'WarehouseRecommendationSystem',
    'DatabaseHandler',
    'MarketBasketAnalyzer',
    'SimilarityCalculator',
    'ClusteringAnalyzer',
    'RecommendationGenerator',
    'VisualizationHelper'
]
