"""
Quick test script with a smaller dataset for faster execution.
"""

from warehouse_recommender_main import WarehouseRecommendationSystem

def main():
    print("=== QUICK WAREHOUSE RECOMMENDATION TEST ===\n")
    
    # Initialize the system
    recommender = WarehouseRecommendationSystem()
    
    # Load data with a smaller sample for faster testing
    print("Loading sample data (10,000 records)...")
    recommender.load_data(limit=20000)
    
    if recommender.df is None:
        print("Failed to load data. Exiting...")
        return
    
    print("\n=== CREATING MARKET BASKETS ===")
    recommender.create_market_baskets(min_support=3)  # Lower threshold for smaller dataset
    
    print("\n=== CALCULATING PRODUCT SIMILARITIES ===")
    recommender.calculate_similarity_matrix(metric='jaccard')
    
    print("\n=== PERFORMING HIERARCHICAL CLUSTERING ===")
    recommender.perform_clustering(n_clusters=20)  # Fixed number for testing
    
    print("\n=== GENERATING RECOMMENDATIONS ===")
    recommendations = recommender.generate_recommendations(top_n=3, max_cluster_size=20, save_to_db=True)
    
    # Display results
    print("\n=== WAREHOUSE PLACEMENT RECOMMENDATIONS ===\n")
    for i, rec in enumerate(recommendations, 1):
        print(f"Recommendation #{i} (Cluster {rec['cluster_id']})")
        print(f"Strength Score: {rec['recommendation_strength']:.3f}")
        print(f"Products to place together:")
        for product in rec['products']:
            print(f"  - {product['StockCode']}: {product['Description']} (Qty: {product['Quantity']:,})")
        print(f"Explanation: {rec['explanation']}")
        print("-" * 60)
    
    print(f"\n✓ Generated {len(recommendations)} recommendations successfully!")
    print("✓ Recommendations saved to database!")

if __name__ == "__main__":
    main()
