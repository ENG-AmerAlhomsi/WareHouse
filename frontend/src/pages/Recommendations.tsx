import React, { useEffect, useState } from 'react';
import { recommendationApi } from '../services/api';
import { RecommendationCluster } from '../types/recommendation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

function Recommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await recommendationApi.getAll();
        setRecommendations(data);
      } catch (err) {
        setError('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product Location Recommendations</h1>
      {recommendations.map((cluster) => (
        <Card key={cluster.clusterId} className="mb-6">
          <CardHeader>
            <CardTitle>Cluster {cluster.clusterId}</CardTitle>
          </CardHeader>
          <CardContent>
              <p>Coherence Score: {cluster.coherenceScore}</p>
              <p>Recommendation Strength: {cluster.recommendationStrength}</p>
              <p>Total Quantity Sold: {cluster.totalQuantitySold}</p>
              <p>Average Unit Price: ${cluster.avgUnitPrice.toFixed(2)}</p>
              <p>Explanation: {cluster.explanation}</p>
              <h3 className="font-semibold mt-4">Products:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cluster.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.stockCode}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default Recommendations;