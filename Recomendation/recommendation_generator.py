"""
Recommendation generation module for warehouse recommendation system.
Handles generation of product placement recommendations based on clustering results.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from clustering_analyzer import ClusteringAnalyzer
from similarity_calculator import SimilarityCalculator


class RecommendationGenerator:
    """
    Generates product placement recommendations based on clustering analysis.
    """
    
    def __init__(self, clustering_analyzer: ClusteringAnalyzer, 
                 similarity_calculator: SimilarityCalculator):
        """
        Initialize the recommendation generator.
        
        Args:
            clustering_analyzer (ClusteringAnalyzer): Clustering analyzer instance
            similarity_calculator (SimilarityCalculator): Similarity calculator instance
        """
        self.clustering_analyzer = clustering_analyzer
        self.similarity_calculator = similarity_calculator
        self.product_info = None
    
    def set_product_info(self, product_info: pd.DataFrame):
        """
        Set product information for recommendation generation.
        
        Args:
            product_info (pd.DataFrame): Product information dataframe
        """
        self.product_info = product_info
    
    def generate_recommendations(self, top_n: int = 10, 
                               min_cluster_size: int = 2, 
                               max_cluster_size: int = 100,
                               save_to_db: bool = False,
                               db_handler: Optional[Any] = None) -> List[Dict[str, Any]]:
        """
        Generate product placement recommendations.
        
        Args:
            top_n (int): Number of top recommendations to return
            min_cluster_size (int): Minimum cluster size to consider
            max_cluster_size (int): Maximum cluster size to consider (prevents overly large clusters)
            save_to_db (bool): Whether to save recommendations to database
            db_handler: Database handler instance for saving to database
            
        Returns:
            List[Dict[str, Any]]: List of recommendation dictionaries
        """
        if self.clustering_analyzer.clusters is None:
            raise ValueError("Please perform clustering first")
            
        print("Generating placement recommendations...")
        
        recommendations = []
        
        # Analyze each cluster
        cluster_summary = self.clustering_analyzer.clusters.groupby('Cluster').agg({'StockCode': 'count'}).rename(columns={'StockCode': 'cluster_size'})
        
        for cluster_id in self.clustering_analyzer.clusters['Cluster'].unique():
            cluster_products = self.clustering_analyzer.get_cluster_products(cluster_id)
            
            if len(cluster_products) >= min_cluster_size and len(cluster_products) <= max_cluster_size:
                # Calculate cluster coherence score
                cluster_stock_codes = cluster_products['StockCode'].tolist()
                coherence_score = self._calculate_cluster_coherence(cluster_stock_codes)
                
                # Calculate business impact score
                recommendation = {
                    'cluster_id': int(cluster_id),
                    'coherence_score': float(coherence_score),
                }
                
                # Get product details from product_info for this cluster
                cluster_stock_codes = cluster_products['StockCode'].tolist()
                if self.product_info is not None:
                    cluster_product_info = self.product_info[self.product_info['StockCode'].isin(cluster_stock_codes)]
                    
                    # Calculate total quantity sold and average unit price
                    if not cluster_product_info.empty:
                        total_quantity = cluster_product_info['TotalQuantity'].sum()
                        avg_unit_price = cluster_product_info['AvgUnitPrice'].mean()
                        
                        recommendation['total_quantity_sold'] = int(total_quantity)
                        recommendation['avg_unit_price'] = float(avg_unit_price)
                        recommendation['recommendation_strength'] = float(coherence_score * np.log(total_quantity + 1))
                    else:
                        # Fallback to just coherence score if no product info
                        recommendation['recommendation_strength'] = float(coherence_score)
                        recommendation['total_quantity_sold'] = 0
                        recommendation['avg_unit_price'] = 0.0
                else:
                    # Fallback to just coherence score if no product info
                    recommendation['recommendation_strength'] = float(coherence_score)
                    recommendation['total_quantity_sold'] = 0
                    recommendation['avg_unit_price'] = 0.0
                
                # Create products list with full details from product_info
                recommendation['products'] = []
                for stock_code in cluster_stock_codes:
                    if self.product_info is not None:
                        product_data = self.product_info[self.product_info['StockCode'] == stock_code]
                        if not product_data.empty:
                            product_info = product_data.iloc[0]
                            product_dict = {
                                'StockCode': str(stock_code),
                                'Description': str(product_info['Description']),
                                'Quantity': int(product_info['TotalQuantity'])
                            }
                            recommendation['products'].append(product_dict)
                    else:
                        # Fallback if no product info available
                        product_dict = {
                            'StockCode': str(stock_code),
                            'Description': 'N/A',
                            'Quantity': 0
                        }
                        recommendation['products'].append(product_dict)
                
                recommendation['explanation'] = self._generate_explanation(cluster_products)
                
                recommendations.append(recommendation)
        
        # Sort by recommendation strength
        recommendations.sort(key=lambda x: x['recommendation_strength'], reverse=True)
        
        # Save recommendations to database if requested
        if save_to_db and db_handler is not None:
            print("\nSaving top recommendations to database...")
            success = db_handler.save_recommendations_to_db(recommendations[:top_n])
            print(f"Database save result: {'Success' if success else 'Failed'}")
        elif save_to_db and db_handler is None:
            print("Warning: save_to_db=True but no db_handler provided. Skipping database save.")
        else:
            print("\nSkipping database save (save_to_db=False)")
        
        return recommendations[:top_n]
    
    def _calculate_cluster_coherence(self, stock_codes: List[str]) -> float:
        """
        Calculate average similarity within cluster.
        
        Args:
            stock_codes (List[str]): List of product stock codes in the cluster
            
        Returns:
            float: Average similarity within the cluster
        """
        if len(stock_codes) < 2:
            return 0
            
        similarities = []
        for i, prod1 in enumerate(stock_codes):
            for j, prod2 in enumerate(stock_codes):
                if i < j and prod1 in self.similarity_calculator.similarity_matrix.index and prod2 in self.similarity_calculator.similarity_matrix.columns:
                    similarities.append(self.similarity_calculator.similarity_matrix.loc[prod1, prod2])
                    
        return np.mean(similarities) if similarities else 0
    
    def _generate_explanation(self, cluster_products: pd.DataFrame) -> str:
        """
        Generate human-readable explanation for the recommendation.
        
        Args:
            cluster_products (pd.DataFrame): Products in the cluster
            
        Returns:
            str: Human-readable explanation
        """
        total_items = len(cluster_products)
        
        explanation = f"These {total_items} products are frequently purchased together. "
        
        if 'TotalQuantity' in cluster_products.columns:
            total_quantity = cluster_products['TotalQuantity'].sum()
            explanation += f"(total sales: {total_quantity:,} units). "
        
        explanation += "Placing them close together can reduce picking time and improve warehouse efficiency."
        
        return explanation
    
    def get_recommendation_summary(self, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get summary statistics for a list of recommendations.
        
        Args:
            recommendations (List[Dict[str, Any]]): List of recommendations
            
        Returns:
            Dict[str, Any]: Summary statistics
        """
        if not recommendations:
            return {}
        
        coherence_scores = [rec['coherence_score'] for rec in recommendations]
        strength_scores = [rec['recommendation_strength'] for rec in recommendations]
        cluster_sizes = [len(rec['products']) for rec in recommendations]
        
        summary = {
            'total_recommendations': len(recommendations),
            'avg_coherence_score': np.mean(coherence_scores),
            'avg_strength_score': np.mean(strength_scores),
            'avg_cluster_size': np.mean(cluster_sizes),
            'total_products_recommended': sum(cluster_sizes),
            'min_coherence_score': np.min(coherence_scores),
            'max_coherence_score': np.max(coherence_scores),
            'min_strength_score': np.min(strength_scores),
            'max_strength_score': np.max(strength_scores)
        }
        
        return summary
    
    def filter_recommendations_by_strength(self, recommendations: List[Dict[str, Any]], 
                                         min_strength: float) -> List[Dict[str, Any]]:
        """
        Filter recommendations by minimum strength score.
        
        Args:
            recommendations (List[Dict[str, Any]]): List of recommendations
            min_strength (float): Minimum strength score threshold
            
        Returns:
            List[Dict[str, Any]]: Filtered recommendations
        """
        return [rec for rec in recommendations if rec['recommendation_strength'] >= min_strength]
    
    def filter_recommendations_by_coherence(self, recommendations: List[Dict[str, Any]], 
                                          min_coherence: float) -> List[Dict[str, Any]]:
        """
        Filter recommendations by minimum coherence score.
        
        Args:
            recommendations (List[Dict[str, Any]]): List of recommendations
            min_coherence (float): Minimum coherence score threshold
            
        Returns:
            List[Dict[str, Any]]: Filtered recommendations
        """
        return [rec for rec in recommendations if rec['coherence_score'] >= min_coherence]
