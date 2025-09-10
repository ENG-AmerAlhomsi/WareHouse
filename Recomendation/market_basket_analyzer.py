"""
Market basket analysis module for warehouse recommendation system.
Handles transformation of transaction data into market basket format.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any


class MarketBasketAnalyzer:
    """
    Handles market basket analysis and transformation of transaction data.
    """
    
    def __init__(self):
        """Initialize the market basket analyzer."""
        self.basket_matrix = None
        self.frequent_products = None
    
    def create_market_baskets(self, df: pd.DataFrame, min_support: int = 10) -> pd.DataFrame:
        """
        Transform transaction data into market basket format.
        
        Args:
            df (pd.DataFrame): Transaction data with StockCode and InvoiceNo columns
            min_support (int): Minimum number of transactions a product must appear in
            
        Returns:
            pd.DataFrame: Binary basket matrix
        """
        print("Creating market baskets...")
        
        # Group by invoice to create baskets
        baskets = df.groupby('InvoiceNo')['StockCode'].apply(list).reset_index()
        baskets.columns = ['InvoiceNo', 'products']
        
        # Filter products by minimum support
        product_counts = df['StockCode'].value_counts()
        self.frequent_products = product_counts[product_counts >= min_support].index.tolist()
        
        print(f"Found {len(self.frequent_products)} frequent products (min_support={min_support})")
        
        # Create binary matrix
        basket_data = []
        for idx, row in baskets.iterrows():
            products_in_basket = [p for p in row['products'] if p in self.frequent_products]
            if len(products_in_basket) > 1:  # Only consider baskets with multiple items
                basket_data.append({
                    'InvoiceNo': row['InvoiceNo'],
                    'products': products_in_basket
                })
        
        # Convert to binary matrix
        all_products = sorted(self.frequent_products)
        matrix_data = []
        
        for basket in basket_data:
            row = [1 if product in basket['products'] else 0 for product in all_products]
            matrix_data.append(row)
        
        self.basket_matrix = pd.DataFrame(matrix_data, columns=all_products)
        print(f"Created basket matrix: {self.basket_matrix.shape}")
        
        return self.basket_matrix
    
    def get_basket_matrix(self) -> pd.DataFrame:
        """
        Get the current basket matrix.
        
        Returns:
            pd.DataFrame: The basket matrix
        """
        if self.basket_matrix is None:
            raise ValueError("Market baskets not created yet. Call create_market_baskets() first.")
        return self.basket_matrix
    
    def get_frequent_products(self) -> List[str]:
        """
        Get the list of frequent products.
        
        Returns:
            List[str]: List of frequent product stock codes
        """
        if self.frequent_products is None:
            raise ValueError("Market baskets not created yet. Call create_market_baskets() first.")
        return self.frequent_products
    
    def get_basket_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the market baskets.
        
        Returns:
            Dict[str, Any]: Dictionary containing basket statistics
        """
        if self.basket_matrix is None:
            raise ValueError("Market baskets not created yet. Call create_market_baskets() first.")
        
        stats = {
            'total_baskets': len(self.basket_matrix),
            'total_products': len(self.basket_matrix.columns),
            'avg_products_per_basket': self.basket_matrix.sum(axis=1).mean(),
            'max_products_in_basket': self.basket_matrix.sum(axis=1).max(),
            'min_products_in_basket': self.basket_matrix.sum(axis=1).min(),
            'sparsity': (self.basket_matrix == 0).sum().sum() / (self.basket_matrix.shape[0] * self.basket_matrix.shape[1])
        }
        
        return stats
    
    def get_product_frequency(self) -> pd.Series:
        """
        Get frequency of each product in the baskets.
        
        Returns:
            pd.Series: Product frequency counts
        """
        if self.basket_matrix is None:
            raise ValueError("Market baskets not created yet. Call create_market_baskets() first.")
        
        return self.basket_matrix.sum().sort_values(ascending=False)
    
    def filter_products_by_frequency(self, min_frequency: int) -> pd.DataFrame:
        """
        Filter the basket matrix to include only products above a minimum frequency.
        
        Args:
            min_frequency (int): Minimum frequency threshold
            
        Returns:
            pd.DataFrame: Filtered basket matrix
        """
        if self.basket_matrix is None:
            raise ValueError("Market baskets not created yet. Call create_market_baskets() first.")
        
        product_frequencies = self.basket_matrix.sum()
        frequent_products = product_frequencies[product_frequencies >= min_frequency].index
        
        filtered_matrix = self.basket_matrix[frequent_products]
        print(f"Filtered to {len(frequent_products)} products (min_frequency={min_frequency})")
        
        return filtered_matrix
