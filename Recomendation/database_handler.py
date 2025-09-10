"""
Database connection and data loading module for warehouse recommendation system.
Handles all database operations including connection, data loading, and table creation.
"""

import pandas as pd
import mysql.connector
from sqlalchemy import create_engine, text
from typing import Optional, Dict, Any


class DatabaseHandler:
    """
    Handles all database operations for the warehouse recommendation system.
    """
    
    def __init__(self, db_connection_string: Optional[str] = None):
        """
        Initialize the database handler.
        
        Args:
            db_connection_string (str): SQLAlchemy database connection string (optional)
                                      If None, will use mysql.connector directly
        """
        if db_connection_string:
            self.engine = create_engine(db_connection_string)
            self.use_sqlalchemy = True
        else:
            # Use mysql.connector like your working script
            self.db_config = {
                'host': 'localhost',
                'database': 'warehouse-management-system-dev',
                'user': 'root',
                'password': '27015'
            }
            self.use_sqlalchemy = False
    
    def load_data(self, query: Optional[str] = None, limit: Optional[int] = None) -> Optional[pd.DataFrame]:
        """
        Load order history data from MySQL database.
        
        Args:
            query (str): Custom SQL query (optional)
            limit (int): Limit number of records for testing (optional)
            
        Returns:
            pd.DataFrame: Loaded and cleaned data, or None if failed
        """
        if query is None:
            columns = [
                "country", "customer_id", "description", "invoice_date", 
                "invoice_no", "quantity", "stock_code", "unit_price"
            ]
            query = f"SELECT {', '.join(columns)} FROM order_history WHERE quantity > 0 AND stock_code IS NOT NULL AND invoice_no IS NOT NULL AND description IS NOT NULL AND description != ''"
            
            if limit:
                query += f" LIMIT {limit}"
        
        print(f"Loading data from MySQL database: warehouse-management-system-dev")
        if limit:
            print(f"Using sample of {limit:,} records for testing...")
        else:
            print("Loading full dataset - this may take a moment...")
        
        try:
            if self.use_sqlalchemy:
                # Use SQLAlchemy + pandas
                df = pd.read_sql(query, self.engine)
            else:
                # Use mysql.connector like your working script
                conn = mysql.connector.connect(**self.db_config)
                df = pd.read_sql(query, conn)
                conn.close()
                
            print(f"✓ Successfully loaded {len(df):,} records")
            
        except Exception as e:
            print(f"✗ Error loading data: {e}")
            print(f"Error type: {type(e).__name__}")
            return None
        
        # Clean and return the data
        return self._clean_data(df)
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean the loaded data.
        
        Args:
            df (pd.DataFrame): Raw data from database
            
        Returns:
            pd.DataFrame: Cleaned data
        """
        # Basic data cleaning (using column names from your script)
        initial_count = len(df)
        
        # Rename columns to match expected format 
        column_mapping = {
            'stock_code': 'StockCode',
            'invoice_no': 'InvoiceNo', 
            'description': 'Description',
            'quantity': 'Quantity',
            'unit_price': 'UnitPrice',
            'customer_id': 'CustomerID',
            'country': 'Country',
            'invoice_date': 'InvoiceDate'
        }
        
        # Rename columns if they exist
        existing_columns = {old: new for old, new in column_mapping.items() if old in df.columns}
        if existing_columns:
            df = df.rename(columns=existing_columns)
        
        # Clean data
        df = df.dropna(subset=['StockCode', 'InvoiceNo', 'Description'])
        df['StockCode'] = df['StockCode'].astype(str).str.strip()
        df['InvoiceNo'] = df['InvoiceNo'].astype(str).str.strip()
        
        # Remove test/invalid transactions
        df = df[~df['InvoiceNo'].str.startswith('C', na=False)]  # Remove cancellations
        df = df[df['Quantity'] > 0]  # Positive quantities only
        
        final_count = len(df)
        print(f"Data cleaning complete:")
        print(f"  - Initial records: {initial_count:,}")
        print(f"  - Final records: {final_count:,}")
        print(f"  - Unique products: {df['StockCode'].nunique():,}")
        print(f"  - Unique invoices: {df['InvoiceNo'].nunique():,}")
        
        if 'InvoiceDate' in df.columns:
            print(f"  - Date range: {df['InvoiceDate'].min()} to {df['InvoiceDate'].max()}")
        
        return df
    
    def create_product_info(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create product information summary from the main dataframe.
        
        Args:
            df (pd.DataFrame): Main transaction data
            
        Returns:
            pd.DataFrame: Product information summary
        """
        product_info = df.groupby('StockCode').agg({
            'Description': 'first',
            'UnitPrice': 'mean',
            'Quantity': 'sum',
            'InvoiceNo': 'nunique'  # Number of unique orders
        }).reset_index()
        product_info.columns = ['StockCode', 'Description', 'AvgUnitPrice', 'TotalQuantity', 'OrderCount']
        
        return product_info
    
    def ensure_recommendation_tables_exist(self) -> bool:
        """
        Ensure that the recommendation tables exist in the database.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            print("Creating recommendation tables if they don't exist...")
            
            # SQL to create the tables - clean SQL statements without extra whitespace
            create_cluster_table_sql = "CREATE TABLE IF NOT EXISTS recommendation_clusters (cluster_id INT AUTO_INCREMENT PRIMARY KEY, coherence_score FLOAT NOT NULL, recommendation_strength FLOAT NOT NULL, total_quantity_sold INT, avg_unit_price DECIMAL(10, 2), explanation TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
            
            create_products_table_sql = "CREATE TABLE IF NOT EXISTS recommendation_products (id INT AUTO_INCREMENT PRIMARY KEY, cluster_id INT NOT NULL, stock_code VARCHAR(50) NOT NULL, description VARCHAR(255), quantity INT, FOREIGN KEY (cluster_id) REFERENCES recommendation_clusters(cluster_id) ON DELETE CASCADE)"
            
            # MySQL uses different syntax for creating indexes
            create_cluster_index_sql = "CREATE INDEX idx_recommendation_products_cluster_id ON recommendation_products(cluster_id)"
            
            create_stock_index_sql = "CREATE INDEX idx_recommendation_products_stock_code ON recommendation_products(stock_code)"
            
            # Execute the SQL based on the connection method
            if self.use_sqlalchemy:
                print("Using SQLAlchemy to create tables")
                try:
                    with self.engine.connect() as connection:
                        print("Creating recommendation_clusters table...")
                        connection.execute(text(create_cluster_table_sql))
                        print("Creating recommendation_products table...")
                        connection.execute(text(create_products_table_sql))
                        
                        # Try to create indexes, but ignore if they already exist
                        print("Creating indexes...")
                        try:
                            connection.execute(text(create_cluster_index_sql))
                        except Exception as e:
                            print(f"Warning creating cluster index: {e}")
                            
                        try:
                            connection.execute(text(create_stock_index_sql))
                        except Exception as e:
                            print(f"Warning creating stock index: {e}")
                        
                        connection.commit()
                except Exception as e:
                    print(f"Error in SQLAlchemy table creation: {e}")
                    raise
            else:
                print("Using mysql.connector to create tables")
                try:
                    conn = mysql.connector.connect(**self.db_config)
                    cursor = conn.cursor()
                    
                    # Execute each statement separately
                    print("Creating recommendation_clusters table...")
                    cursor.execute(create_cluster_table_sql)
                    print("Creating recommendation_products table...")
                    cursor.execute(create_products_table_sql)
                    
                    # Try to create indexes, but ignore if they already exist
                    print("Creating indexes...")
                    try:
                        cursor.execute(create_cluster_index_sql)
                    except Exception as e:
                        print(f"Warning creating cluster index: {e}")
                        
                    try:
                        cursor.execute(create_stock_index_sql)
                    except Exception as e:
                        print(f"Warning creating stock index: {e}")
                    
                    conn.commit()
                    cursor.close()
                    conn.close()
                    print("Tables created successfully")
                except Exception as e:
                    print(f"Error in mysql.connector table creation: {e}")
                    raise
                    
            return True
        except Exception as e:
            print(f"✗ Error creating recommendation tables: {e}")
            return False
    
    def save_recommendations_to_db(self, recommendations: list) -> bool:
        """
        Save generated recommendations to the database.
        
        Args:
            recommendations (list): List of recommendation dictionaries generated by generate_recommendations
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            print("Saving recommendations to database...")
            print(f"Type of recommendations: {type(recommendations)}")
            print(f"Number of recommendations: {len(recommendations) if isinstance(recommendations, list) else 'Not a list'}")
            
            # Validate recommendations format
            if not isinstance(recommendations, list):
                raise TypeError("Recommendations must be a list")
                
            if not recommendations:
                print("No recommendations to save")
                return True
                
            if not isinstance(recommendations[0], dict):
                raise TypeError(f"Each recommendation must be a dictionary, got {type(recommendations[0])}")
            
            # Print first recommendation structure for debugging
            print(f"First recommendation keys: {recommendations[0].keys()}")
            print(f"Products type: {type(recommendations[0]['products'])}")
            if len(recommendations[0]['products']) > 0:
                print(f"First product keys: {recommendations[0]['products'][0].keys()}")
            
            # First, ensure the tables exist
            if not self.ensure_recommendation_tables_exist():
                raise Exception("Failed to create recommendation tables")
            
            # Use the appropriate database connection method
            if self.use_sqlalchemy:
                # Using SQLAlchemy
                with self.engine.connect() as connection:
                    for recommendation in recommendations:
                        # Insert into recommendation_clusters table
                        cluster_query = text("""
                        INSERT INTO recommendation_clusters 
                        (coherence_score, recommendation_strength, total_quantity_sold, avg_unit_price, explanation) 
                        VALUES (:coherence_score, :recommendation_strength, :total_quantity_sold, :avg_unit_price, :explanation)
                        """)
                        
                        # Prepare values with None handling
                        total_quantity = recommendation.get('total_quantity_sold', None)
                        avg_price = recommendation.get('avg_unit_price', None)
                        
                        # Execute the query and get the inserted cluster_id
                        result = connection.execute(
                            cluster_query, 
                            {
                                'coherence_score': float(recommendation['coherence_score']),
                                'recommendation_strength': float(recommendation['recommendation_strength']),
                                'total_quantity_sold': int(total_quantity) if total_quantity is not None else None,
                                'avg_unit_price': float(avg_price) if avg_price is not None else None,
                                'explanation': recommendation['explanation']
                            }
                        )
                        
                        # Get the last inserted ID
                        cluster_id = result.lastrowid or connection.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
                        
                        # Insert products for this cluster
                        product_query = text("""
                        INSERT INTO recommendation_products 
                        (cluster_id, stock_code, description, quantity) 
                        VALUES (:cluster_id, :stock_code, :description, :quantity)
                        """)
                        
                        for product in recommendation['products']:
                            # Prepare values with None handling
                            description = product.get('Description', None)
                            quantity = product.get('Quantity', None)
                            
                            connection.execute(
                                product_query, 
                                {
                                    'cluster_id': cluster_id,
                                    'stock_code': str(product['StockCode']),
                                    'description': str(description) if description is not None else None,
                                    'quantity': int(quantity) if quantity is not None else None
                                }
                            )
                    
                    connection.commit()
            else:
                # Using mysql.connector
                conn = mysql.connector.connect(**self.db_config)
                cursor = conn.cursor()
                
                for recommendation in recommendations:
                    # Insert into recommendation_clusters table
                    cluster_query = """
                    INSERT INTO recommendation_clusters 
                    (coherence_score, recommendation_strength, total_quantity_sold, avg_unit_price, explanation) 
                    VALUES (%s, %s, %s, %s, %s)
                    """
                    
                    # Prepare values with None handling
                    total_quantity = recommendation.get('total_quantity_sold', None)
                    avg_price = recommendation.get('avg_unit_price', None)
                    
                    # Execute the query
                    cursor.execute(
                        cluster_query, 
                        (recommendation['coherence_score'], 
                         recommendation['recommendation_strength'],
                         total_quantity,
                         avg_price,
                         recommendation['explanation'])
                    )
                    
                    # Get the last inserted ID
                    cluster_id = cursor.lastrowid
                    
                    # Insert products for this cluster
                    for product in recommendation['products']:
                        product_query = """
                        INSERT INTO recommendation_products 
                        (cluster_id, stock_code, description, quantity) 
                        VALUES (%s, %s, %s, %s)
                        """
                        
                        # Prepare values with None handling
                        description = product.get('Description', None)
                        quantity = product.get('Quantity', None)
                        
                        cursor.execute(
                            product_query, 
                            (cluster_id, 
                             product['StockCode'],
                             description,
                             quantity)
                        )
                
                # Commit the transaction
                conn.commit()
                cursor.close()
                conn.close()
                
            print(f"✓ Successfully saved {len(recommendations)} recommendations to database")
            return True
            
        except Exception as e:
            print(f"✗ Error saving recommendations to database: {e}")
            print(f"Error type: {type(e).__name__}")
            return False
