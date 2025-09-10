"""
Simplified FastAPI application for warehouse recommendation system.
Provides only the main essential endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
import logging
from datetime import datetime
import tempfile

from warehouse_recommender_main import WarehouseRecommendationSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Warehouse Recommendation System API",
    description="API for generating product placement recommendations using hierarchical clustering",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global recommendation system instance
recommender_system = None

# Pydantic models for request/response
class QuickTestRequest(BaseModel):
    limit: int = Field(default=20000, ge=1000, le=100000, description="Number of records to load for testing")
    min_support: int = Field(default=3, ge=1, description="Minimum support for market basket analysis")
    n_clusters: int = Field(default=20, ge=5, le=50, description="Number of clusters for testing")
    top_n: int = Field(default=3, ge=1, le=20, description="Number of recommendations to return")
    max_cluster_size: int = Field(default=20, ge=5, le=50, description="Maximum cluster size for testing")
    save_to_db: bool = Field(default=True, description="Whether to save recommendations to database")

class FullPipelineRequest(BaseModel):
    limit: int = Field(default=50000, ge=1000, le=200000, description="Number of records to load")
    min_support: int = Field(default=10, ge=1, description="Minimum support for market basket analysis")
    n_clusters: int = Field(default=25, ge=5, le=100, description="Number of clusters")
    top_n: int = Field(default=10, ge=1, le=50, description="Number of recommendations to return")
    max_cluster_size: int = Field(default=100, ge=5, le=200, description="Maximum cluster size")
    save_to_db: bool = Field(default=True, description="Whether to save recommendations to database")

class VisualizationRequest(BaseModel):
    figsize_width: int = Field(default=15, ge=5, le=30, description="Figure width")
    figsize_height: int = Field(default=8, ge=5, le=20, description="Figure height")
    format: Literal['png', 'jpg', 'svg', 'pdf'] = Field(default='png', description="Image format")
    dpi: int = Field(default=300, ge=72, le=600, description="Image DPI")

class ProductInfo(BaseModel):
    StockCode: str
    Description: str
    Quantity: int

class Recommendation(BaseModel):
    cluster_id: int
    coherence_score: float
    recommendation_strength: float
    total_quantity_sold: Optional[int] = None
    avg_unit_price: Optional[float] = None
    products: List[ProductInfo]
    explanation: str

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Initialize the recommendation system
@app.on_event("startup")
async def startup_event():
    """Initialize the recommendation system on startup."""
    global recommender_system
    try:
        recommender_system = WarehouseRecommendationSystem()
        logger.info("Warehouse recommendation system initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize recommendation system: {e}")
        raise

# Health check endpoint
@app.get("/health", response_model=ApiResponse)
async def health_check():
    """Health check endpoint."""
    return ApiResponse(
        success=True,
        message="Warehouse Recommendation System API is running",
        data={"status": "healthy"}
    )

# Quick test endpoint (equivalent to quick_test.py)
@app.post("/test/quick", response_model=ApiResponse)
async def quick_test(request: QuickTestRequest):
    """Run a quick test of the recommendation system with a smaller dataset."""
    if recommender_system is None:
        raise HTTPException(status_code=500, detail="Recommendation system not initialized")
    
    try:
        # Load data with limit
        logger.info(f"Loading sample data ({request.limit:,} records)...")
        df = recommender_system.load_data(limit=request.limit)
        
        if df is None:
            return ApiResponse(
                success=False,
                message="Failed to load data for quick test"
            )
        
        # Create market baskets
        logger.info("Creating market baskets...")
        recommender_system.create_market_baskets(min_support=request.min_support)
        
        # Calculate similarity
        logger.info("Calculating product similarities...")
        recommender_system.calculate_similarity_matrix(metric='jaccard')
        
        # Perform clustering
        logger.info("Performing hierarchical clustering...")
        recommender_system.perform_clustering(n_clusters=request.n_clusters)
        
        # Generate recommendations
        logger.info("Generating recommendations...")
        recommendations = recommender_system.generate_recommendations(
            top_n=request.top_n,
            max_cluster_size=request.max_cluster_size,
            save_to_db=request.save_to_db
        )
        
        return ApiResponse(
            success=True,
            message=f"Quick test completed successfully with {len(recommendations)} recommendations",
            data={
                "records_processed": len(df),
                "recommendations_generated": len(recommendations),
                "test_parameters": {
                    "limit": request.limit,
                    "min_support": request.min_support,
                    "n_clusters": request.n_clusters,
                    "top_n": request.top_n,
                    "max_cluster_size": request.max_cluster_size,
                    "save_to_db": request.save_to_db
                },
                "recommendations": recommendations
            }
        )
    except Exception as e:
        logger.error(f"Error in quick test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Full pipeline endpoint (equivalent to warehouse_recommender_main.py)
@app.post("/pipeline/full", response_model=ApiResponse)
async def run_full_pipeline(request: FullPipelineRequest):
    """Run the complete recommendation pipeline in one call."""
    if recommender_system is None:
        raise HTTPException(status_code=500, detail="Recommendation system not initialized")
    
    try:
        # Step 1: Load data
        logger.info("Step 1: Loading data...")
        df = recommender_system.load_data(limit=request.limit)
        if df is None:
            return ApiResponse(success=False, message="Failed to load data")
        
        # Step 2: Create market baskets
        logger.info("Step 2: Creating market baskets...")
        recommender_system.create_market_baskets(request.min_support)
        
        # Step 3: Calculate similarity
        logger.info("Step 3: Calculating similarity...")
        recommender_system.calculate_similarity_matrix(metric='jaccard')
        
        # Step 4: Perform clustering
        logger.info("Step 4: Performing clustering...")
        recommender_system.perform_clustering(n_clusters=request.n_clusters)
        
        # Step 5: Generate recommendations
        logger.info("Step 5: Generating recommendations...")
        recommendations = recommender_system.generate_recommendations(
            top_n=request.top_n,
            min_cluster_size=2,
            max_cluster_size=request.max_cluster_size,
            save_to_db=request.save_to_db
        )
        
        return ApiResponse(
            success=True,
            message="Full pipeline completed successfully",
            data={
                "records_processed": len(df),
                "recommendations_generated": len(recommendations),
                "recommendations": recommendations
            }
        )
    except Exception as e:
        logger.error(f"Error in full pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Generate dendrogram visualization
@app.post("/visualizations/dendrogram")
async def generate_dendrogram(request: VisualizationRequest):
    """Generate and return a dendrogram visualization."""
    if recommender_system is None:
        raise HTTPException(status_code=500, detail="Recommendation system not initialized")
    
    try:
        if recommender_system.similarity_calculator.similarity_matrix is None:
            raise HTTPException(status_code=400, detail="Please run quick test or full pipeline first")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{request.format}') as tmp_file:
            temp_path = tmp_file.name
        
        # Generate dendrogram
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        import matplotlib.pyplot as plt
        
        # Set the similarity matrix in visualization helper
        recommender_system.visualization_helper.set_similarity_matrix(
            recommender_system.similarity_calculator.similarity_matrix
        )
        
        # Generate dendrogram and save to file
        recommender_system.visualization_helper.visualize_dendrogram(
            figsize=(request.figsize_width, request.figsize_height)
        )
        
        # Save the current figure
        plt.savefig(temp_path, format=request.format, dpi=request.dpi, bbox_inches='tight')
        plt.close()
        
        return FileResponse(
            temp_path,
            media_type=f'image/{request.format}',
            filename=f'dendrogram.{request.format}'
        )
    except Exception as e:
        logger.error(f"Error generating dendrogram: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Generate comprehensive dashboard
@app.post("/visualizations/dashboard")
async def generate_dashboard(request: VisualizationRequest):
    """Generate and return a comprehensive dashboard visualization."""
    if recommender_system is None:
        raise HTTPException(status_code=500, detail="Recommendation system not initialized")
    
    try:
        # Check if all required data is available
        if (recommender_system.similarity_calculator.similarity_matrix is None or 
            recommender_system.clustering_analyzer.clusters is None):
            raise HTTPException(status_code=400, detail="Please run quick test or full pipeline first")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{request.format}') as tmp_file:
            temp_path = tmp_file.name
        
        # Generate comprehensive dashboard
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        import matplotlib.pyplot as plt
        
        # Set data in visualization helper
        recommender_system.visualization_helper.set_similarity_matrix(
            recommender_system.similarity_calculator.similarity_matrix
        )
        recommender_system.visualization_helper.set_clusters(
            recommender_system.clustering_analyzer.clusters
        )
        
        # Get product frequencies
        product_frequencies = recommender_system.basket_analyzer.get_product_frequency()
        
        # Calculate coherence scores for all clusters
        coherence_scores = {}
        for cluster_id in recommender_system.clustering_analyzer.clusters['Cluster'].unique():
            coherence_scores[cluster_id] = recommender_system.clustering_analyzer.calculate_cluster_coherence(cluster_id)
        
        # Generate recommendations for the dashboard
        recommendations = recommender_system.generate_recommendations(
            top_n=10, 
            min_cluster_size=2, 
            max_cluster_size=100, 
            save_to_db=False
        )
        
        # Generate comprehensive dashboard and save to file
        recommender_system.visualization_helper.create_comprehensive_dashboard(
            recommendations, product_frequencies, coherence_scores,
            figsize=(request.figsize_width, request.figsize_height)
        )
        
        # Save the current figure
        plt.savefig(temp_path, format=request.format, dpi=request.dpi, bbox_inches='tight')
        plt.close()
        
        return FileResponse(
            temp_path,
            media_type=f'image/{request.format}',
            filename=f'dashboard.{request.format}'
        )
    except Exception as e:
        logger.error(f"Error generating dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)