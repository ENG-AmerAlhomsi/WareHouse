"""
Visualization helper module for warehouse recommendation system.
Handles creation of visualizations for clustering and similarity analysis.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from scipy.cluster.hierarchy import dendrogram, linkage
from scipy.spatial.distance import pdist
from typing import Optional, Tuple


class VisualizationHelper:
    """
    Handles visualization of clustering and similarity analysis results.
    """
    
    def __init__(self):
        """Initialize the visualization helper."""
        self.similarity_matrix = None
        self.clusters = None
    
    def set_similarity_matrix(self, similarity_matrix: pd.DataFrame):
        """
        Set the similarity matrix for visualization.
        
        Args:
            similarity_matrix (pd.DataFrame): Product similarity matrix
        """
        self.similarity_matrix = similarity_matrix
    
    def set_clusters(self, clusters: pd.DataFrame):
        """
        Set the clustering results for visualization.
        
        Args:
            clusters (pd.DataFrame): Clustering results
        """
        self.clusters = clusters
    
    def visualize_dendrogram(self, figsize: Tuple[int, int] = (15, 8)) -> None:
        """
        Create dendrogram visualization.
        
        Args:
            figsize (Tuple[int, int]): Figure size
        """
        if self.similarity_matrix is None:
            raise ValueError("Please set similarity matrix first")
            
        # Convert similarity to distance
        distance_matrix = 1 - self.similarity_matrix.values
        
        # Perform hierarchical clustering for dendrogram
        condensed_dist = pdist(distance_matrix, metric='precomputed')
        linkage_matrix = linkage(condensed_dist, method='complete')
        
        plt.figure(figsize=figsize)
        dendrogram(
            linkage_matrix,
            labels=self.similarity_matrix.index.tolist(),
            leaf_rotation=90,
            leaf_font_size=8
        )
        plt.title('Product Similarity Dendrogram')
        plt.xlabel('Products')
        plt.ylabel('Distance')
        plt.tight_layout()
        plt.show()
    
    def visualize_similarity_heatmap(self, figsize: Tuple[int, int] = (12, 10), 
                                   top_n: Optional[int] = None) -> None:
        """
        Create similarity matrix heatmap visualization.
        
        Args:
            figsize (Tuple[int, int]): Figure size
            top_n (Optional[int]): Number of top products to show (if None, show all)
        """
        if self.similarity_matrix is None:
            raise ValueError("Please set similarity matrix first")
        
        # Select top products if specified
        if top_n is not None and top_n < len(self.similarity_matrix):
            # Get top products by average similarity
            avg_similarities = self.similarity_matrix.mean(axis=1).sort_values(ascending=False)
            top_products = avg_similarities.head(top_n).index
            similarity_data = self.similarity_matrix.loc[top_products, top_products]
        else:
            similarity_data = self.similarity_matrix
        
        plt.figure(figsize=figsize)
        sns.heatmap(similarity_data, 
                   annot=False, 
                   cmap='YlOrRd', 
                   square=True,
                   cbar_kws={'label': 'Similarity Score'})
        plt.title('Product Similarity Heatmap')
        plt.xlabel('Products')
        plt.ylabel('Products')
        plt.tight_layout()
        plt.show()
    
    def visualize_cluster_distribution(self, figsize: Tuple[int, int] = (10, 6)) -> None:
        """
        Create cluster size distribution visualization.
        
        Args:
            figsize (Tuple[int, int]): Figure size
        """
        if self.clusters is None:
            raise ValueError("Please set clusters first")
        
        cluster_counts = self.clusters['Cluster'].value_counts().sort_index()
        
        plt.figure(figsize=figsize)
        cluster_counts.plot(kind='bar')
        plt.title('Cluster Size Distribution')
        plt.xlabel('Cluster ID')
        plt.ylabel('Number of Products')
        plt.xticks(rotation=0)
        plt.tight_layout()
        plt.show()
    
    def visualize_cluster_coherence(self, coherence_scores: dict, 
                                  figsize: Tuple[int, int] = (10, 6)) -> None:
        """
        Create cluster coherence scores visualization.
        
        Args:
            coherence_scores (dict): Dictionary mapping cluster_id to coherence score
            figsize (Tuple[int, int]): Figure size
        """
        if not coherence_scores:
            print("No coherence scores provided")
            return
        
        cluster_ids = list(coherence_scores.keys())
        scores = list(coherence_scores.values())
        
        plt.figure(figsize=figsize)
        plt.bar(cluster_ids, scores)
        plt.title('Cluster Coherence Scores')
        plt.xlabel('Cluster ID')
        plt.ylabel('Coherence Score')
        plt.xticks(rotation=0)
        plt.tight_layout()
        plt.show()
    
    def visualize_recommendation_strength(self, recommendations: list, 
                                        figsize: Tuple[int, int] = (12, 6)) -> None:
        """
        Create recommendation strength visualization.
        
        Args:
            recommendations (list): List of recommendation dictionaries
            figsize (Tuple[int, int]): Figure size
        """
        if not recommendations:
            print("No recommendations provided")
            return
        
        cluster_ids = [rec['cluster_id'] for rec in recommendations]
        strength_scores = [rec['recommendation_strength'] for rec in recommendations]
        coherence_scores = [rec['coherence_score'] for rec in recommendations]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)
        
        # Recommendation strength
        ax1.bar(cluster_ids, strength_scores, color='skyblue')
        ax1.set_title('Recommendation Strength Scores')
        ax1.set_xlabel('Cluster ID')
        ax1.set_ylabel('Strength Score')
        ax1.tick_params(axis='x', rotation=0)
        
        # Coherence scores
        ax2.bar(cluster_ids, coherence_scores, color='lightcoral')
        ax2.set_title('Cluster Coherence Scores')
        ax2.set_xlabel('Cluster ID')
        ax2.set_ylabel('Coherence Score')
        ax2.tick_params(axis='x', rotation=0)
        
        plt.tight_layout()
        plt.show()
    
    def visualize_product_frequency(self, product_frequencies: pd.Series, 
                                  top_n: int = 20, 
                                  figsize: Tuple[int, int] = (12, 8)) -> None:
        """
        Create product frequency visualization.
        
        Args:
            product_frequencies (pd.Series): Product frequency counts
            top_n (int): Number of top products to show
            figsize (Tuple[int, int]): Figure size
        """
        top_products = product_frequencies.head(top_n)
        
        plt.figure(figsize=figsize)
        top_products.plot(kind='bar')
        plt.title(f'Top {top_n} Most Frequent Products')
        plt.xlabel('Product Stock Code')
        plt.ylabel('Frequency')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()
    
    def visualize_similarity_distribution(self, figsize: Tuple[int, int] = (10, 6)) -> None:
        """
        Create similarity score distribution visualization.
        
        Args:
            figsize (Tuple[int, int]): Figure size
        """
        if self.similarity_matrix is None:
            raise ValueError("Please set similarity matrix first")
        
        # Get upper triangle values (excluding diagonal)
        upper_triangle = np.triu(self.similarity_matrix.values, k=1)
        similarities = upper_triangle[upper_triangle > 0]
        
        plt.figure(figsize=figsize)
        plt.hist(similarities, bins=30, alpha=0.7, edgecolor='black')
        plt.title('Distribution of Product Similarity Scores')
        plt.xlabel('Similarity Score')
        plt.ylabel('Frequency')
        plt.axvline(np.mean(similarities), color='red', linestyle='--', 
                   label=f'Mean: {np.mean(similarities):.3f}')
        plt.legend()
        plt.tight_layout()
        plt.show()
    
    def create_comprehensive_dashboard(self, recommendations: list, 
                                     product_frequencies: pd.Series,
                                     coherence_scores: dict,
                                     figsize: Tuple[int, int] = (16, 12)) -> None:
        """
        Create a comprehensive dashboard with multiple visualizations.
        
        Args:
            recommendations (list): List of recommendation dictionaries
            product_frequencies (pd.Series): Product frequency counts
            coherence_scores (dict): Dictionary mapping cluster_id to coherence score
            figsize (Tuple[int, int]): Figure size
        """
        fig = plt.figure(figsize=figsize)
        
        # Create a 2x3 grid
        gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)
        
        # 1. Cluster distribution
        ax1 = fig.add_subplot(gs[0, 0])
        if self.clusters is not None:
            cluster_counts = self.clusters['Cluster'].value_counts().sort_index()
            cluster_counts.plot(kind='bar', ax=ax1)
            ax1.set_title('Cluster Size Distribution')
            ax1.set_xlabel('Cluster ID')
            ax1.set_ylabel('Number of Products')
            ax1.tick_params(axis='x', rotation=0)
        
        # 2. Top products frequency
        ax2 = fig.add_subplot(gs[0, 1])
        top_products = product_frequencies.head(10)
        top_products.plot(kind='bar', ax=ax2)
        ax2.set_title('Top 10 Most Frequent Products')
        ax2.set_xlabel('Product Stock Code')
        ax2.set_ylabel('Frequency')
        ax2.tick_params(axis='x', rotation=45)
        
        # 3. Recommendation strength
        ax3 = fig.add_subplot(gs[0, 2])
        if recommendations:
            cluster_ids = [rec['cluster_id'] for rec in recommendations]
            strength_scores = [rec['recommendation_strength'] for rec in recommendations]
            ax3.bar(cluster_ids, strength_scores, color='skyblue')
            ax3.set_title('Recommendation Strength')
            ax3.set_xlabel('Cluster ID')
            ax3.set_ylabel('Strength Score')
            ax3.tick_params(axis='x', rotation=0)
        
        # 4. Coherence scores
        ax4 = fig.add_subplot(gs[1, 0])
        if coherence_scores:
            cluster_ids = list(coherence_scores.keys())
            scores = list(coherence_scores.values())
            ax4.bar(cluster_ids, scores, color='lightcoral')
            ax4.set_title('Cluster Coherence Scores')
            ax4.set_xlabel('Cluster ID')
            ax4.set_ylabel('Coherence Score')
            ax4.tick_params(axis='x', rotation=0)
        
        # 5. Similarity distribution
        ax5 = fig.add_subplot(gs[1, 1])
        if self.similarity_matrix is not None:
            upper_triangle = np.triu(self.similarity_matrix.values, k=1)
            similarities = upper_triangle[upper_triangle > 0]
            ax5.hist(similarities, bins=20, alpha=0.7, edgecolor='black')
            ax5.set_title('Similarity Score Distribution')
            ax5.set_xlabel('Similarity Score')
            ax5.set_ylabel('Frequency')
            ax5.axvline(np.mean(similarities), color='red', linestyle='--', 
                       label=f'Mean: {np.mean(similarities):.3f}')
            ax5.legend()
        
        # 6. Summary statistics
        ax6 = fig.add_subplot(gs[1, 2])
        ax6.axis('off')
        
        # Create summary text
        summary_text = "Summary Statistics:\n\n"
        if self.clusters is not None:
            summary_text += f"Total Clusters: {len(self.clusters['Cluster'].unique())}\n"
            summary_text += f"Total Products: {len(self.clusters)}\n"
        if recommendations:
            summary_text += f"Recommendations: {len(recommendations)}\n"
            avg_strength = np.mean([rec['recommendation_strength'] for rec in recommendations])
            summary_text += f"Avg Strength: {avg_strength:.3f}\n"
        if self.similarity_matrix is not None:
            upper_triangle = np.triu(self.similarity_matrix.values, k=1)
            similarities = upper_triangle[upper_triangle > 0]
            summary_text += f"Avg Similarity: {np.mean(similarities):.3f}\n"
        
        ax6.text(0.1, 0.5, summary_text, transform=ax6.transAxes, 
                fontsize=12, verticalalignment='center')
        
        plt.suptitle('Warehouse Recommendation System Dashboard', fontsize=16)
        plt.show()
