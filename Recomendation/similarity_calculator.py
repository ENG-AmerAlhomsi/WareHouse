"""
Similarity calculation module for warehouse recommendation system.
Handles calculation of product similarity matrices using various metrics.
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import Literal


class SimilarityCalculator:
    """
    Handles calculation of product similarity matrices using various metrics.
    """
    
    def __init__(self):
        """Initialize the similarity calculator."""
        self.similarity_matrix = None
        self.basket_matrix = None
    
    def calculate_similarity_matrix(self, basket_matrix: pd.DataFrame, 
                                  metric: Literal['jaccard', 'cosine', 'lift'] = 'jaccard') -> pd.DataFrame:
        """
        Calculate product similarity matrix.
        
        Args:
            basket_matrix (pd.DataFrame): Binary basket matrix
            metric (str): Similarity metric ('jaccard', 'cosine', 'lift')
            
        Returns:
            pd.DataFrame: Similarity matrix
        """
        print(f"Calculating similarity matrix using {metric} metric...")
        
        self.basket_matrix = basket_matrix
        
        if metric == 'jaccard':
            similarity_matrix = self._calculate_jaccard_similarity()
        elif metric == 'cosine':
            similarity_matrix = self._calculate_cosine_similarity()
        elif metric == 'lift':
            similarity_matrix = self._calculate_lift_similarity()
        else:
            raise ValueError(f"Unknown similarity metric: {metric}")
        
        self.similarity_matrix = pd.DataFrame(
            similarity_matrix, 
            index=basket_matrix.columns, 
            columns=basket_matrix.columns
        )
        
        return self.similarity_matrix
    
    def _calculate_jaccard_similarity(self) -> np.ndarray:
        """Calculate Jaccard similarity matrix."""
        similarity_matrix = np.zeros((len(self.basket_matrix.columns), len(self.basket_matrix.columns)))
        products = self.basket_matrix.columns
        
        for i, prod1 in enumerate(products):
            for j, prod2 in enumerate(products):
                if i <= j:
                    intersection = ((self.basket_matrix[prod1] == 1) & 
                                  (self.basket_matrix[prod2] == 1)).sum()
                    union = ((self.basket_matrix[prod1] == 1) | 
                           (self.basket_matrix[prod2] == 1)).sum()
                    
                    if union > 0:
                        jaccard_sim = intersection / union
                    else:
                        jaccard_sim = 0
                        
                    similarity_matrix[i, j] = jaccard_sim
                    similarity_matrix[j, i] = jaccard_sim
                    
        return similarity_matrix
    
    def _calculate_cosine_similarity(self) -> np.ndarray:
        """Calculate cosine similarity matrix."""
        return cosine_similarity(self.basket_matrix.T)
    
    def _calculate_lift_similarity(self) -> np.ndarray:
        """Calculate lift-based similarity matrix."""
        products = self.basket_matrix.columns
        n_transactions = len(self.basket_matrix)
        lift_matrix = np.zeros((len(products), len(products)))
        
        # Calculate support for each product
        support = {}
        for product in products:
            support[product] = self.basket_matrix[product].sum() / n_transactions
            
        for i, prod1 in enumerate(products):
            for j, prod2 in enumerate(products):
                if i <= j:
                    # Calculate confidence and lift
                    both = ((self.basket_matrix[prod1] == 1) & 
                           (self.basket_matrix[prod2] == 1)).sum()
                    confidence_1_2 = both / self.basket_matrix[prod1].sum() if self.basket_matrix[prod1].sum() > 0 else 0
                    
                    if support[prod2] > 0:
                        lift = confidence_1_2 / support[prod2]
                    else:
                        lift = 0
                        
                    # Normalize lift to similarity score
                    similarity = max(0, min(1, (lift - 1) / 10 + 0.5)) if lift > 0 else 0
                    
                    lift_matrix[i, j] = similarity
                    lift_matrix[j, i] = similarity
                    
        return lift_matrix
    
    def get_similarity_matrix(self) -> pd.DataFrame:
        """
        Get the current similarity matrix.
        
        Returns:
            pd.DataFrame: The similarity matrix
        """
        if self.similarity_matrix is None:
            raise ValueError("Similarity matrix not calculated yet. Call calculate_similarity_matrix() first.")
        return self.similarity_matrix
    
    def get_distance_matrix(self) -> np.ndarray:
        """
        Convert similarity matrix to distance matrix.
        
        Returns:
            np.ndarray: Distance matrix
        """
        if self.similarity_matrix is None:
            raise ValueError("Similarity matrix not calculated yet. Call calculate_similarity_matrix() first.")
        
        distance_matrix = 1 - self.similarity_matrix.values
        np.fill_diagonal(distance_matrix, 0)
        return distance_matrix
    
    def get_similarity_statistics(self) -> dict:
        """
        Get statistics about the similarity matrix.
        
        Returns:
            dict: Dictionary containing similarity statistics
        """
        if self.similarity_matrix is None:
            raise ValueError("Similarity matrix not calculated yet. Call calculate_similarity_matrix() first.")
        
        # Get upper triangle values (excluding diagonal)
        upper_triangle = np.triu(self.similarity_matrix.values, k=1)
        similarities = upper_triangle[upper_triangle > 0]
        
        stats = {
            'mean_similarity': np.mean(similarities),
            'median_similarity': np.median(similarities),
            'std_similarity': np.std(similarities),
            'min_similarity': np.min(similarities),
            'max_similarity': np.max(similarities),
            'high_similarity_pairs': np.sum(similarities > 0.5),
            'total_pairs': len(similarities)
        }
        
        return stats
    
    def get_most_similar_products(self, product: str, top_n: int = 10) -> pd.Series:
        """
        Get the most similar products to a given product.
        
        Args:
            product (str): Product stock code
            top_n (int): Number of top similar products to return
            
        Returns:
            pd.Series: Most similar products with similarity scores
        """
        if self.similarity_matrix is None:
            raise ValueError("Similarity matrix not calculated yet. Call calculate_similarity_matrix() first.")
        
        if product not in self.similarity_matrix.index:
            raise ValueError(f"Product {product} not found in similarity matrix")
        
        similarities = self.similarity_matrix[product].sort_values(ascending=False)
        # Remove the product itself (similarity = 1.0)
        similarities = similarities[similarities.index != product]
        
        return similarities.head(top_n)
    
    def get_similarity_threshold_products(self, threshold: float = 0.5) -> list:
        """
        Get all product pairs with similarity above a threshold.
        
        Args:
            threshold (float): Similarity threshold
            
        Returns:
            list: List of tuples (product1, product2, similarity)
        """
        if self.similarity_matrix is None:
            raise ValueError("Similarity matrix not calculated yet. Call calculate_similarity_matrix() first.")
        
        high_similarity_pairs = []
        
        for i, prod1 in enumerate(self.similarity_matrix.index):
            for j, prod2 in enumerate(self.similarity_matrix.columns):
                if i < j:  # Only upper triangle to avoid duplicates
                    similarity = self.similarity_matrix.loc[prod1, prod2]
                    if similarity >= threshold:
                        high_similarity_pairs.append((prod1, prod2, similarity))
        
        # Sort by similarity score
        high_similarity_pairs.sort(key=lambda x: x[2], reverse=True)
        
        return high_similarity_pairs
