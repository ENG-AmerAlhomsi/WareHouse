"""
Example usage script for the modular warehouse recommendation system.
This script demonstrates how to use the refactored system.
"""

from warehouse_recommender_main import WarehouseRecommendationSystem


def main():
    """
    Main function demonstrating the usage of the warehouse recommendation system.
    """
    print("=== WAREHOUSE RECOMMENDATION SYSTEM EXAMPLE ===\n")
    
    # Initialize the system (now more flexible)
    print("=== TESTING BOTH CONNECTION METHODS ===\n")
    
    # Method 1: Direct mysql.connector (like your working script)
    print("Method 1: Using mysql.connector directly...")
    try:
        recommender = WarehouseRecommendationSystem()  # No connection string = use mysql.connector
        print("✓ Successfully initialized with mysql.connector")
    except Exception as e:
        print(f"✗ mysql.connector method failed: {e}")
        
    # Method 2: SQLAlchemy (fallback)
    print("\nMethod 2: Using SQLAlchemy...")
    try:
        db_connection = "mysql+pymysql://root:27015@localhost/warehouse-management-system-dev"
        recommender_alt = WarehouseRecommendationSystem(db_connection)
        print("✓ Successfully initialized with SQLAlchemy")
        recommender = recommender_alt  # Use this one if mysql.connector failed
    except Exception as e:
        print(f"✗ SQLAlchemy method failed: {e}")
        print("Failed to connect with any method. Exiting...")
        return
    
    # Load and process data (start with smaller sample for testing)
    print("\n=== STARTING WAREHOUSE RECOMMENDATION SYSTEM ===\n")
    
    # For initial testing, use a sample. Remove limit=50000 to process all 500K records
    recommender.load_data()  # Remove limit parameter for full dataset
    
    if recommender.df is None:
        print("Failed to load data. Exiting...")
        return
    
    print("\n=== CREATING MARKET BASKETS ===")
    recommender.create_market_baskets(min_support=5)  # Lower threshold for testing
    
    if recommender.basket_analyzer.basket_matrix is None:
        print("Failed to create market baskets. Exiting...")
        return
        
    print("\n=== CALCULATING PRODUCT SIMILARITIES ===")
    recommender.calculate_similarity_matrix(metric='jaccard')
    
    print("\n=== PERFORMING HIERARCHICAL CLUSTERING ===")
    # For better cluster balance, you can specify n_clusters directly
    # clusters = recommender.perform_clustering(n_clusters=8)  # Example: force 8 clusters
    clusters = recommender.perform_clustering()
    
    print("\n=== GENERATING RECOMMENDATIONS ===")
    # Use max_cluster_size=50 to avoid overly large clusters
    recommendations = recommender.generate_recommendations(top_n=5, max_cluster_size=50, save_to_db=True)
    
    # Display results
    print("\n=== WAREHOUSE PLACEMENT RECOMMENDATIONS ===\n")
    for i, rec in enumerate(recommendations, 1):
        print(f"Recommendation #{i} (Cluster {rec['cluster_id']})")
        print(f"Strength Score: {rec['recommendation_strength']:.3f}")
        print(f"Products to place together:")
        for product in rec['products']:
            product_info = f"  - {product['StockCode']}"
            if 'Description' in product:
                product_info += f": {product['Description']}"
            if 'Quantity' in product:
                product_info += f" (Qty: {product['Quantity']:,})"
            print(product_info)
        print(f"Explanation: {rec['explanation']}")
        print("-" * 80)
    
    # Optional: Visualize dendrogram
    # recommender.visualize_dendrogram()
    
    # Get detailed cluster analysis
    cluster_analysis = recommender.get_cluster_analysis()
    print(f"\nCreated {len(cluster_analysis)} product clusters for warehouse optimization")
    
    # Display system summary
    print("\n=== SYSTEM SUMMARY ===")
    summary = recommender.get_system_summary()
    for key, value in summary.items():
        if isinstance(value, dict):
            print(f"{key}:")
            for sub_key, sub_value in value.items():
                print(f"  {sub_key}: {sub_value}")
        else:
            print(f"{key}: {value}")


def demonstrate_individual_modules():
    """
    Demonstrate usage of individual modules for more granular control.
    """
    print("\n=== INDIVIDUAL MODULE DEMONSTRATION ===\n")
    
    from database_handler import DatabaseHandler
    from market_basket_analyzer import MarketBasketAnalyzer
    from similarity_calculator import SimilarityCalculator
    from clustering_analyzer import ClusteringAnalyzer
    from recommendation_generator import RecommendationGenerator
    from visualization_helper import VisualizationHelper
    
    # Initialize individual modules
    db_handler = DatabaseHandler()
    basket_analyzer = MarketBasketAnalyzer()
    similarity_calculator = SimilarityCalculator()
    clustering_analyzer = ClusteringAnalyzer()
    visualization_helper = VisualizationHelper()
    
    # Load data
    print("Loading data...")
    df = db_handler.load_data(limit=1000)  # Small sample for demo
    if df is None:
        print("Failed to load data")
        return
    
    # Create product info
    product_info = db_handler.create_product_info(df)
    
    # Create market baskets
    print("Creating market baskets...")
    basket_matrix = basket_analyzer.create_market_baskets(df, min_support=3)
    
    # Calculate similarities
    print("Calculating similarities...")
    similarity_matrix = similarity_calculator.calculate_similarity_matrix(basket_matrix, 'jaccard')
    
    # Perform clustering
    print("Performing clustering...")
    clusters = clustering_analyzer.perform_clustering(similarity_matrix, product_info)
    
    # Generate recommendations
    print("Generating recommendations...")
    recommendation_generator = RecommendationGenerator(clustering_analyzer, similarity_calculator)
    recommendation_generator.set_product_info(product_info)
    recommendations = recommendation_generator.generate_recommendations(top_n=3, save_to_db=False)
    
    # Display results
    print("\n=== INDIVIDUAL MODULE RESULTS ===")
    print(f"Loaded {len(df)} records")
    print(f"Created {basket_matrix.shape[0]} baskets with {basket_matrix.shape[1]} products")
    print(f"Generated {len(recommendations)} recommendations")
    
    # Show basket statistics
    basket_stats = basket_analyzer.get_basket_statistics()
    print(f"\nBasket Statistics:")
    for key, value in basket_stats.items():
        print(f"  {key}: {value}")
    
    # Show similarity statistics
    similarity_stats = similarity_calculator.get_similarity_statistics()
    print(f"\nSimilarity Statistics:")
    for key, value in similarity_stats.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    # Run the main example
    main()
    
    # Uncomment to run individual module demonstration
    # demonstrate_individual_modules()
