"""
Clustering analysis module for warehouse recommendation system.
Handles Agglomerative Hierarchical Clustering of products.
"""

import pandas as pd
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score
from typing import Optional, Literal, Dict, Any


class ClusteringAnalyzer:
    """
    Handles Agglomerative Hierarchical Clustering of products based on similarity.
    """
    
    def __init__(self):
        """Initialize the clustering analyzer."""
        self.clusters = None
        self.similarity_matrix = None
        self.product_info = None
    
    def perform_clustering(self, similarity_matrix: pd.DataFrame, product_info: pd.DataFrame,
                          n_clusters: Optional[int] = None, 
                          linkage: Literal['complete', 'average', 'single'] = 'complete',
                          distance_threshold: Optional[float] = None,
                          max_cluster_size: Optional[int] = None) -> pd.DataFrame:
        """
        Perform Agglomerative Hierarchical Clustering.
        
        Args:
            similarity_matrix (pd.DataFrame): Product similarity matrix
            product_info (pd.DataFrame): Product information dataframe
            n_clusters (int): Number of clusters (optional)
            linkage (str): Linkage criterion ('complete', 'average', 'single')
            distance_threshold (float): Distance threshold for automatic cluster detection
            max_cluster_size (int): Maximum size per cluster to ensure balanced clusters
            
        Returns:
            pd.DataFrame: Clustering results with product assignments
        """
        print("Performing Agglomerative Hierarchical Clustering...")
        
        self.similarity_matrix = similarity_matrix
        self.product_info = product_info
        
        # Convert similarity to distance matrix
        distance_matrix = 1 - similarity_matrix.values
        np.fill_diagonal(distance_matrix, 0)
        
        # Determine optimal number of clusters if not specified
        if n_clusters is None and distance_threshold is None:
            n_clusters = self._determine_optimal_clusters(distance_matrix)
            
        # Perform clustering
        clustering = AgglomerativeClustering(
            n_clusters=n_clusters,
            distance_threshold=distance_threshold,
            linkage=linkage,
            metric='precomputed'
        )
        
        cluster_labels = clustering.fit_predict(distance_matrix)
        
        # Check cluster sizes and potentially re-cluster if too unbalanced
        unique_labels, counts = np.unique(cluster_labels, return_counts=True)
        cluster_sizes = dict(zip(unique_labels, counts))
        
        # If clusters are too unbalanced, try to adjust
        max_size = max(counts) if len(counts) > 0 else 0
        min_size = min(counts) if len(counts) > 0 else 0
        
        if max_size > 3 * min_size and len(counts) > 2:
            print(f"Warning: Unbalanced clusters detected (max: {max_size}, min: {min_size})")
            print("Consider adjusting cluster parameters for more balanced results")
        
        # Create cluster results
        self.clusters = pd.DataFrame({
            'StockCode': similarity_matrix.index,
            'Cluster': cluster_labels
        })
        
        # Add product information
        self.clusters = self.clusters.merge(product_info, on='StockCode', how='left')
        
        # Print cluster distribution
        cluster_counts = self.clusters['Cluster'].value_counts().sort_index()
        print(f"Created {len(cluster_counts)} clusters with sizes: {cluster_counts.tolist()}")
        
        return self.clusters
    
    def _determine_optimal_clusters(self, distance_matrix: np.ndarray) -> int:
        """
        Determine optimal number of clusters using practical heuristics.
        
        Args:
            distance_matrix (np.ndarray): Distance matrix
            
        Returns:
            int: Optimal number of clusters
        """
        n_products = len(distance_matrix)
        
        # Use practical approach for warehouse clustering
        if n_products <= 10:
            n_clusters = 2
        elif n_products <= 50:
            n_clusters = min(5, n_products // 10)
        elif n_products <= 200:
            n_clusters = min(8, n_products // 25)
        elif n_products <= 1000:
            n_clusters = min(12, n_products // 50)
        else:
            n_clusters = min(15, n_products // 100)
        
        print(f"Using practical cluster count: {n_clusters} clusters for {n_products} products")
        return n_clusters
    
    def find_optimal_clusters_silhouette(self, distance_matrix: np.ndarray, max_clusters: int = 20) -> int:
        """
        Find optimal number of clusters using silhouette analysis.
        
        Args:
            distance_matrix (np.ndarray): Distance matrix
            max_clusters (int): Maximum number of clusters to test
            
        Returns:
            int: Optimal number of clusters
        """
        silhouette_scores = []
        cluster_range = range(2, min(max_clusters + 1, len(distance_matrix)))
        
        for n in cluster_range:
            clustering = AgglomerativeClustering(
                n_clusters=n, 
                linkage='complete', 
                metric='precomputed'
            )
            labels = clustering.fit_predict(distance_matrix)
            score = silhouette_score(distance_matrix, labels, metric='precomputed')
            silhouette_scores.append(score)
            
        optimal_clusters = cluster_range[np.argmax(silhouette_scores)]
        print(f"Optimal number of clusters: {optimal_clusters} (silhouette score: {max(silhouette_scores):.3f})")
        
        return optimal_clusters
    
    def get_clusters(self) -> pd.DataFrame:
        """
        Get the current clustering results.
        
        Returns:
            pd.DataFrame: Clustering results
        """
        if self.clusters is None:
            raise ValueError("Clustering not performed yet. Call perform_clustering() first.")
        return self.clusters
    
    def get_cluster_analysis(self) -> list:
        """
        Get detailed cluster analysis.
        
        Returns:
            list: List of cluster information dictionaries
        """
        if self.clusters is None:
            raise ValueError("Clustering not performed yet. Call perform_clustering() first.")
            
        analysis = []
        
        for cluster_id in sorted(self.clusters['Cluster'].unique()):
            cluster_data = self.clusters[self.clusters['Cluster'] == cluster_id]
            
            cluster_info = {
                'cluster_id': cluster_id,
                'size': len(cluster_data)
            }
            
            # Add quantity and price info if available
            if 'TotalQuantity' in cluster_data.columns:
                cluster_info['total_quantity'] = cluster_data['TotalQuantity'].sum()
            
            if 'AvgUnitPrice' in cluster_data.columns:
                cluster_info['avg_price'] = cluster_data['AvgUnitPrice'].mean()
            
            if 'Description' in cluster_data.columns:
                cluster_info['products'] = cluster_data['Description'].tolist()
            else:
                cluster_info['products'] = cluster_data['StockCode'].tolist()
                
            analysis.append(cluster_info)
            
        return analysis
    
    def get_cluster_statistics(self) -> Dict[str, Any]:
        """
        Get overall clustering statistics.
        
        Returns:
            Dict[str, Any]: Dictionary containing clustering statistics
        """
        if self.clusters is None:
            raise ValueError("Clustering not performed yet. Call perform_clustering() first.")
        
        cluster_counts = self.clusters['Cluster'].value_counts()
        
        stats = {
            'total_clusters': len(cluster_counts),
            'total_products': len(self.clusters),
            'avg_cluster_size': cluster_counts.mean(),
            'min_cluster_size': cluster_counts.min(),
            'max_cluster_size': cluster_counts.max(),
            'std_cluster_size': cluster_counts.std(),
            'cluster_size_distribution': cluster_counts.tolist()
        }
        
        return stats
    
    def get_cluster_products(self, cluster_id: int) -> pd.DataFrame:
        """
        Get products in a specific cluster.
        
        Args:
            cluster_id (int): Cluster ID
            
        Returns:
            pd.DataFrame: Products in the specified cluster
        """
        if self.clusters is None:
            raise ValueError("Clustering not performed yet. Call perform_clustering() first.")
        
        return self.clusters[self.clusters['Cluster'] == cluster_id]
    
    def calculate_cluster_coherence(self, cluster_id: int) -> float:
        """
        Calculate average similarity within a cluster.
        
        Args:
            cluster_id (int): Cluster ID
            
        Returns:
            float: Average similarity within the cluster
        """
        if self.clusters is None or self.similarity_matrix is None:
            raise ValueError("Clustering and similarity matrix not available.")
        
        cluster_products = self.get_cluster_products(cluster_id)
        stock_codes = cluster_products['StockCode'].tolist()
        
        if len(stock_codes) < 2:
            return 0
            
        similarities = []
        for i, prod1 in enumerate(stock_codes):
            for j, prod2 in enumerate(stock_codes):
                if i < j and prod1 in self.similarity_matrix.index and prod2 in self.similarity_matrix.columns:
                    similarities.append(self.similarity_matrix.loc[prod1, prod2])
                    
        return np.mean(similarities) if similarities else 0
