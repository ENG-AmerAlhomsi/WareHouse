"""
Main warehouse recommendation system class that orchestrates all modules.
This is the main entry point for the warehouse recommendation system.
"""

import pandas as pd
import numpy as np
from typing import Optional, List, Dict, Any, Literal

from database_handler import DatabaseHandler
from market_basket_analyzer import MarketBasketAnalyzer
from similarity_calculator import SimilarityCalculator
from clustering_analyzer import ClusteringAnalyzer
from recommendation_generator import RecommendationGenerator
from visualization_helper import VisualizationHelper


class WarehouseRecommendationSystem:
    """
    Agglomerative Hierarchical Clustering-based Product Placement Recommendation System
    """
    
    def __init__(self, db_connection_string: Optional[str] = None):
        """
        Initialize the recommendation system.
        
        Args:
            db_connection_string (str): SQLAlchemy database connection string (optional)
                                      If None, will use mysql.connector directly
        """
        # Initialize all modules
        self.db_handler = DatabaseHandler(db_connection_string)
        self.basket_analyzer = MarketBasketAnalyzer()
        self.similarity_calculator = SimilarityCalculator()
        self.clustering_analyzer = ClusteringAnalyzer()
        self.visualization_helper = VisualizationHelper()
        
        # Initialize recommendation generator with required dependencies
        self.recommendation_generator = RecommendationGenerator(
            self.clustering_analyzer, 
            self.similarity_calculator
        )
        
        # Data storage
        self.df = None
        self.product_info = None
        
    def load_data(self, query: Optional[str] = None, limit: Optional[int] = None) -> Optional[pd.DataFrame]:
        """
        Load order history data from MySQL database.
        
        Args:
            query (str): Custom SQL query (optional)
            limit (int): Limit number of records for testing (optional)
            
        Returns:
            pd.DataFrame: Loaded and cleaned data, or None if failed
        """
        self.df = self.db_handler.load_data(query, limit)
        
        if self.df is not None:
            # Create product info
            self.product_info = self.db_handler.create_product_info(self.df)
            # Set product info in recommendation generator
            self.recommendation_generator.set_product_info(self.product_info)
        
        return self.df
        
    def create_market_baskets(self, min_support: int = 10) -> pd.DataFrame:
        """
        Transform transaction data into market basket format.
        
        Args:
            min_support (int): Minimum number of transactions a product must appear in
            
        Returns:
            pd.DataFrame: Binary basket matrix
        """
        if self.df is None:
            raise ValueError("Please load data first using load_data()")
            
        return self.basket_analyzer.create_market_baskets(self.df, min_support)
        
    def calculate_similarity_matrix(self, metric: Literal['jaccard', 'cosine', 'lift'] = 'jaccard') -> pd.DataFrame:
        """
        Calculate product similarity matrix.
        
        Args:
            metric (str): Similarity metric ('jaccard', 'cosine', 'lift')
            
        Returns:
            pd.DataFrame: Similarity matrix
        """
        if self.basket_analyzer.basket_matrix is None:
            raise ValueError("Please create market baskets first using create_market_baskets()")
            
        similarity_matrix = self.similarity_calculator.calculate_similarity_matrix(
            self.basket_analyzer.basket_matrix, metric
        )
        
        # Set similarity matrix in visualization helper
        self.visualization_helper.set_similarity_matrix(similarity_matrix)
        
        return similarity_matrix
        
    def perform_clustering(self, n_clusters: Optional[int] = None, 
                          linkage: Literal['complete', 'average', 'single'] = 'complete',
                          distance_threshold: Optional[float] = None,
                          max_cluster_size: Optional[int] = None) -> pd.DataFrame:
        """
        Perform Agglomerative Hierarchical Clustering.
        
        Args:
            n_clusters (int): Number of clusters (optional)
            linkage (str): Linkage criterion ('complete', 'average', 'single')
            distance_threshold (float): Distance threshold for automatic cluster detection
            max_cluster_size (int): Maximum size per cluster to ensure balanced clusters
            
        Returns:
            pd.DataFrame: Clustering results with product assignments
        """
        if self.similarity_calculator.similarity_matrix is None:
            raise ValueError("Please calculate similarity matrix first using calculate_similarity_matrix()")
            
        if self.product_info is None:
            raise ValueError("Product info not available. Please load data first.")
            
        clusters = self.clustering_analyzer.perform_clustering(
            self.similarity_calculator.similarity_matrix,
            self.product_info,
            n_clusters,
            linkage,
            distance_threshold,
            max_cluster_size
        )
        
        # Set clusters in visualization helper
        self.visualization_helper.set_clusters(clusters)
        
        return clusters
        
    def generate_recommendations(self, top_n: int = 10, 
                                min_cluster_size: int = 2, 
                                max_cluster_size: int = 100,
                                save_to_db: bool = False) -> List[Dict[str, Any]]:
        """
        Generate product placement recommendations.
        
        Args:
            top_n (int): Number of top recommendations to return
            min_cluster_size (int): Minimum cluster size to consider
            max_cluster_size (int): Maximum cluster size to consider (prevents overly large clusters)
            save_to_db (bool): Whether to save recommendations to database
            
        Returns:
            List[Dict[str, Any]]: List of recommendation dictionaries
        """
        if self.clustering_analyzer.clusters is None:
            raise ValueError("Please perform clustering first using perform_clustering()")
            
        return self.recommendation_generator.generate_recommendations(
            top_n, min_cluster_size, max_cluster_size, save_to_db, self.db_handler
        )
        
    def get_cluster_analysis(self) -> List[Dict[str, Any]]:
        """
        Get detailed cluster analysis.
        
        Returns:
            List[Dict[str, Any]]: List of cluster information dictionaries
        """
        return self.clustering_analyzer.get_cluster_analysis()
        
    def get_similarity_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the similarity matrix.
        
        Returns:
            Dict[str, Any]: Dictionary containing similarity statistics
        """
        return self.similarity_calculator.get_similarity_statistics()
        
    def get_basket_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the market baskets.
        
        Returns:
            Dict[str, Any]: Dictionary containing basket statistics
        """
        return self.basket_analyzer.get_basket_statistics()
        
    def visualize_dendrogram(self, figsize: tuple = (15, 8)) -> None:
        """
        Create dendrogram visualization.
        
        Args:
            figsize (tuple): Figure size
        """
        self.visualization_helper.visualize_dendrogram(figsize)
        
    def visualize_similarity_heatmap(self, figsize: tuple = (12, 10), top_n: Optional[int] = None) -> None:
        """
        Create similarity matrix heatmap visualization.
        
        Args:
            figsize (tuple): Figure size
            top_n (Optional[int]): Number of top products to show (if None, show all)
        """
        self.visualization_helper.visualize_similarity_heatmap(figsize, top_n)
        
    def visualize_cluster_distribution(self, figsize: tuple = (10, 6)) -> None:
        """
        Create cluster size distribution visualization.
        
        Args:
            figsize (tuple): Figure size
        """
        self.visualization_helper.visualize_cluster_distribution(figsize)
        
    def create_comprehensive_dashboard(self, recommendations: List[Dict[str, Any]], 
                                     figsize: tuple = (16, 12)) -> None:
        """
        Create a comprehensive dashboard with multiple visualizations.
        
        Args:
            recommendations (List[Dict[str, Any]]): List of recommendation dictionaries
            figsize (tuple): Figure size
        """
        # Get product frequencies
        product_frequencies = self.basket_analyzer.get_product_frequency()
        
        # Calculate coherence scores for all clusters
        coherence_scores = {}
        for cluster_id in self.clustering_analyzer.clusters['Cluster'].unique():
            coherence_scores[cluster_id] = self.clustering_analyzer.calculate_cluster_coherence(cluster_id)
        
        self.visualization_helper.create_comprehensive_dashboard(
            recommendations, product_frequencies, coherence_scores, figsize
        )
        
    def get_system_summary(self) -> Dict[str, Any]:
        """
        Get a comprehensive summary of the system state.
        
        Returns:
            Dict[str, Any]: Dictionary containing system summary
        """
        summary = {
            'data_loaded': self.df is not None,
            'baskets_created': self.basket_analyzer.basket_matrix is not None,
            'similarity_calculated': self.similarity_calculator.similarity_matrix is not None,
            'clustering_performed': self.clustering_analyzer.clusters is not None,
            'product_info_available': self.product_info is not None
        }
        
        if self.df is not None:
            summary['total_records'] = len(self.df)
            summary['unique_products'] = self.df['StockCode'].nunique()
            summary['unique_invoices'] = self.df['InvoiceNo'].nunique()
            
        if self.basket_analyzer.basket_matrix is not None:
            summary['basket_statistics'] = self.get_basket_statistics()
            
        if self.similarity_calculator.similarity_matrix is not None:
            summary['similarity_statistics'] = self.get_similarity_statistics()
            
        if self.clustering_analyzer.clusters is not None:
            summary['cluster_statistics'] = self.clustering_analyzer.get_cluster_statistics()
            
        return summary
