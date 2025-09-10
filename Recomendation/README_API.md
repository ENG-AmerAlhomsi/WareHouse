# Warehouse Recommendation System API

This FastAPI application provides REST API endpoints for the warehouse recommendation system, allowing you to generate product placement recommendations using hierarchical clustering.

## Features

- **Full Pipeline API**: Complete recommendation generation workflow
- **Quick Test API**: Fast testing with smaller datasets
- **Modular Endpoints**: Individual steps can be called separately
- **Database Integration**: Save recommendations to MySQL database
- **Comprehensive Documentation**: Auto-generated API docs with Swagger UI

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure your MySQL database is running and accessible with the configuration in `database_handler.py`

## Running the API

### Option 1: Using the run script
```bash
python run_api.py
```

### Option 2: Using uvicorn directly
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Using the app directly
```bash
python app.py
```

## API Endpoints

### Health and Status
- `GET /health` - Health check
- `GET /status` - System status and statistics

### Data Management
- `POST /data/load` - Load order history data from database

### Analysis Steps
- `POST /analysis/baskets` - Create market baskets
- `POST /analysis/similarity` - Calculate product similarity matrix
- `POST /analysis/clustering` - Perform hierarchical clustering

### Recommendations
- `POST /recommendations/generate` - Generate product placement recommendations

### Quick Test
- `POST /test/quick` - Run quick test with smaller dataset

### Full Pipeline
- `POST /pipeline/full` - Run complete recommendation pipeline

### Statistics and Analysis
- `GET /analysis/clusters` - Get cluster analysis
- `GET /analysis/similarity/stats` - Get similarity statistics
- `GET /analysis/baskets/stats` - Get basket statistics

### Visualizations
- `POST /visualizations/dendrogram` - Generate dendrogram visualization
- `POST /visualizations/similarity-heatmap` - Generate similarity heatmap
- `POST /visualizations/cluster-distribution` - Generate cluster distribution chart
- `POST /visualizations/comprehensive-dashboard` - Generate comprehensive dashboard
- `GET /visualizations/available` - Get list of available visualizations

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Example Usage

### Quick Test (Recommended for testing)
```bash
curl -X POST "http://localhost:8000/test/quick" \
     -H "Content-Type: application/json" \
     -d '{
       "limit": 10000,
       "min_support": 3,
       "n_clusters": 15,
       "top_n": 5,
       "max_cluster_size": 20,
       "save_to_db": true
     }'
```

### Full Pipeline
```bash
curl -X POST "http://localhost:8000/pipeline/full" \
     -H "Content-Type: application/json" \
     -d '{
       "data_request": {"limit": 50000},
       "basket_request": {"min_support": 10},
       "similarity_request": {"metric": "jaccard"},
       "clustering_request": {"n_clusters": 25, "linkage": "complete"},
       "recommendation_request": {"top_n": 10, "save_to_db": true}
     }'
```

### Step-by-Step Approach
```bash
# 1. Load data
curl -X POST "http://localhost:8000/data/load" \
     -H "Content-Type: application/json" \
     -d '{"limit": 30000}'

# 2. Create market baskets
curl -X POST "http://localhost:8000/analysis/baskets" \
     -H "Content-Type: application/json" \
     -d '{"min_support": 5}'

# 3. Calculate similarity
curl -X POST "http://localhost:8000/analysis/similarity" \
     -H "Content-Type: application/json" \
     -d '{"metric": "jaccard"}'

# 4. Perform clustering
curl -X POST "http://localhost:8000/analysis/clustering" \
     -H "Content-Type: application/json" \
     -d '{"n_clusters": 20, "linkage": "complete"}'

# 5. Generate recommendations
curl -X POST "http://localhost:8000/recommendations/generate" \
     -H "Content-Type: application/json" \
     -d '{"top_n": 10, "save_to_db": true}'
```

### Visualization Examples

**Generate Dendrogram:**
```bash
curl -X POST "http://localhost:8000/visualizations/dendrogram" \
     -H "Content-Type: application/json" \
     -d '{
       "figsize_width": 15,
       "figsize_height": 8,
       "format": "png",
       "dpi": 300
     }' \
     --output dendrogram.png
```

**Generate Similarity Heatmap:**
```bash
curl -X POST "http://localhost:8000/visualizations/similarity-heatmap" \
     -H "Content-Type: application/json" \
     -d '{
       "figsize_width": 12,
       "figsize_height": 10,
       "top_n": 20,
       "format": "png",
       "dpi": 300
     }' \
     --output similarity_heatmap.png
```

**Generate Cluster Distribution:**
```bash
curl -X POST "http://localhost:8000/visualizations/cluster-distribution" \
     -H "Content-Type: application/json" \
     -d '{
       "figsize_width": 10,
       "figsize_height": 6,
       "format": "png",
       "dpi": 300
     }' \
     --output cluster_distribution.png
```

**Generate Comprehensive Dashboard:**
```bash
curl -X POST "http://localhost:8000/visualizations/comprehensive-dashboard" \
     -H "Content-Type: application/json" \
     -d '{
       "figsize_width": 16,
       "figsize_height": 12,
       "format": "png",
       "dpi": 300
     }' \
     --output comprehensive_dashboard.png
```

**Get Available Visualizations:**
```bash
curl -X GET "http://localhost:8000/visualizations/available"
```

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00"
}
```

## Error Handling

The API includes comprehensive error handling:
- Input validation using Pydantic models
- Database connection error handling
- Processing error handling with detailed error messages
- HTTP status codes for different error types

## Configuration

Database configuration is handled in `database_handler.py`. Update the connection parameters as needed:

```python
self.db_config = {
    'host': 'localhost',
    'database': 'warehouse-management-system-dev',
    'user': 'root',
    'password': '27015'
}
```

## Development

For development with auto-reload:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

For production deployment, consider:
- Using a production ASGI server like Gunicorn with Uvicorn workers
- Setting up proper CORS configuration
- Implementing authentication and authorization
- Adding rate limiting
- Setting up monitoring and logging
