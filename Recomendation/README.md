# Warehouse Recommendation System

A modular warehouse recommendation system based on Agglomerative Hierarchical Clustering for product placement optimization.

## Overview

This system analyzes historical order data to identify products that are frequently purchased together and recommends optimal warehouse placement strategies to improve picking efficiency.

## Architecture

The system has been refactored into modular components for better maintainability and reusability:

### Core Modules

1. **`database_handler.py`** - Database connection and data loading
   - Handles MySQL connections (both mysql.connector and SQLAlchemy)
   - Data cleaning and preprocessing
   - Product information extraction
   - Database table creation and data saving

2. **`market_basket_analyzer.py`** - Market basket analysis
   - Transforms transaction data into market basket format
   - Creates binary product matrices
   - Filters products by minimum support
   - Provides basket statistics

3. **`similarity_calculator.py`** - Product similarity calculation
   - Calculates similarity matrices using multiple metrics (Jaccard, Cosine, Lift)
   - Converts similarity to distance matrices
   - Provides similarity statistics and analysis

4. **`clustering_analyzer.py`** - Hierarchical clustering analysis
   - Performs Agglomerative Hierarchical Clustering
   - Determines optimal cluster counts
   - Calculates cluster coherence scores
   - Provides cluster analysis and statistics

5. **`recommendation_generator.py`** - Recommendation generation
   - Generates product placement recommendations
   - Calculates recommendation strength scores
   - Creates human-readable explanations
   - Filters and ranks recommendations

6. **`visualization_helper.py`** - Visualization utilities
   - Creates dendrograms
   - Generates similarity heatmaps
   - Visualizes cluster distributions
   - Provides comprehensive dashboards

7. **`warehouse_recommender_main.py`** - Main orchestrating class
   - Coordinates all modules
   - Provides high-level API
   - Maintains system state
   - Offers comprehensive functionality

## Usage

### Basic Usage

```python
from warehouse_recommender_main import WarehouseRecommendationSystem

# Initialize the system
recommender = WarehouseRecommendationSystem()

# Load data
recommender.load_data()

# Create market baskets
recommender.create_market_baskets(min_support=10)

# Calculate similarities
recommender.calculate_similarity_matrix(metric='jaccard')

# Perform clustering
recommender.perform_clustering()

# Generate recommendations
recommendations = recommender.generate_recommendations(top_n=5, save_to_db=True)

# Display results
for i, rec in enumerate(recommendations, 1):
    print(f"Recommendation #{i} (Cluster {rec['cluster_id']})")
    print(f"Strength Score: {rec['recommendation_strength']:.3f}")
    print(f"Products: {[p['StockCode'] for p in rec['products']]}")
    print(f"Explanation: {rec['explanation']}")
```

### Advanced Usage with Individual Modules

```python
from database_handler import DatabaseHandler
from market_basket_analyzer import MarketBasketAnalyzer
from similarity_calculator import SimilarityCalculator
from clustering_analyzer import ClusteringAnalyzer
from recommendation_generator import RecommendationGenerator

# Initialize modules
db_handler = DatabaseHandler()
basket_analyzer = MarketBasketAnalyzer()
similarity_calculator = SimilarityCalculator()
clustering_analyzer = ClusteringAnalyzer()

# Load and process data
df = db_handler.load_data(limit=1000)
product_info = db_handler.create_product_info(df)
basket_matrix = basket_analyzer.create_market_baskets(df, min_support=5)
similarity_matrix = similarity_calculator.calculate_similarity_matrix(basket_matrix, 'jaccard')
clusters = clustering_analyzer.perform_clustering(similarity_matrix, product_info)

# Generate recommendations
recommendation_generator = RecommendationGenerator(clustering_analyzer, similarity_calculator)
recommendation_generator.set_product_info(product_info)
recommendations = recommendation_generator.generate_recommendations(top_n=3)
```

## Configuration

### Database Configuration

The system supports two database connection methods:

1. **mysql.connector** (default):
```python
recommender = WarehouseRecommendationSystem()  # Uses default config
```

2. **SQLAlchemy**:
```python
db_connection = "mysql+pymysql://user:password@host/database"
recommender = WarehouseRecommendationSystem(db_connection)
```

### Parameters

- **`min_support`**: Minimum number of transactions a product must appear in
- **`metric`**: Similarity metric ('jaccard', 'cosine', 'lift')
- **`n_clusters`**: Number of clusters (auto-determined if None)
- **`linkage`**: Linkage criterion ('complete', 'average', 'single')
- **`top_n`**: Number of top recommendations to return
- **`max_cluster_size`**: Maximum size per cluster

## Visualization

The system provides various visualization options:

```python
# Dendrogram
recommender.visualize_dendrogram()

# Similarity heatmap
recommender.visualize_similarity_heatmap(top_n=20)

# Cluster distribution
recommender.visualize_cluster_distribution()

# Comprehensive dashboard
recommender.create_comprehensive_dashboard(recommendations)
```

## Output

The system generates recommendations in the following format:

```python
{
    'cluster_id': 0,
    'coherence_score': 0.75,
    'recommendation_strength': 2.34,
    'total_quantity_sold': 1500,
    'avg_unit_price': 25.50,
    'products': [
        {
            'StockCode': 'ABC123',
            'Description': 'Product A',
            'Quantity': 500
        },
        # ... more products
    ],
    'explanation': 'These 3 products are frequently purchased together...'
}
```

## Dependencies

- pandas
- numpy
- scikit-learn
- scipy
- matplotlib
- seaborn
- sqlalchemy
- mysql-connector-python

## Installation

```bash
pip install pandas numpy scikit-learn scipy matplotlib seaborn sqlalchemy mysql-connector-python
```

## Example Script

Run the example script to see the system in action:

```bash
python example_usage.py
```

This will demonstrate both the high-level API and individual module usage.
