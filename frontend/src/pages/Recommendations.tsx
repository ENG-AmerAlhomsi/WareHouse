import React, { useEffect, useState } from 'react';
import { recommendationApi, aiRecommendationApi } from '../services/api';
import { RecommendationCluster } from '../types/recommendation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Loader2, Download, Brain, BarChart3, TrendingUp } from 'lucide-react';

function Recommendations() {
  // Existing recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  // AI parameters state
  const [quickTestParams, setQuickTestParams] = useState({
    limit: 20000,
    min_support: 3,
    n_clusters: 20,
    top_n: 3,
    max_cluster_size: 20,
    save_to_db: true
  });

  const [fullPipelineParams, setFullPipelineParams] = useState({
    limit: 50000,
    min_support: 10,
    n_clusters: 25,
    top_n: 10,
    max_cluster_size: 100,
    save_to_db: true
  });

  const [visualizationParams, setVisualizationParams] = useState({
    figsize_width: 15,
    figsize_height: 8,
    format: 'png' as 'png' | 'jpg' | 'svg' | 'pdf',
    dpi: 300
  });

  // Fetch existing recommendations
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

  // AI API functions
  const runQuickTest = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiStatus('running');
    
    try {
      const result = await aiRecommendationApi.quickTest(quickTestParams);
      setAiRecommendations(result);
      setAiStatus('completed');
    } catch (err: any) {
      setAiError(err.response?.data?.detail || 'Failed to run quick test');
      setAiStatus('error');
    } finally {
      setAiLoading(false);
    }
  };

  const runFullPipeline = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiStatus('running');
    
    try {
      const result = await aiRecommendationApi.fullPipeline(fullPipelineParams);
      setAiRecommendations(result);
      setAiStatus('completed');
    } catch (err: any) {
      setAiError(err.response?.data?.detail || 'Failed to run full pipeline');
      setAiStatus('error');
    } finally {
      setAiLoading(false);
    }
  };

  const generateDendrogram = async () => {
    try {
      const blob = await aiRecommendationApi.generateDendrogram(visualizationParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dendrogram.${visualizationParams.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setAiError(err.response?.data?.detail || 'Failed to generate dendrogram');
    }
  };

  const generateDashboard = async () => {
    try {
      const blob = await aiRecommendationApi.generateDashboard(visualizationParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard.${visualizationParams.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setAiError(err.response?.data?.detail || 'Failed to generate dashboard');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Brain className="h-8 w-8" />
        Product Location Recommendations
      </h1>

      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Existing Recommendations</TabsTrigger>
          <TabsTrigger value="ai">AI-Powered Analysis</TabsTrigger>
        </TabsList>

        {/* Existing Recommendations Tab */}
        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Current Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-gray-500">No recommendations available</p>
              ) : (
                <div className="space-y-4">
      {recommendations.map((cluster) => (
                    <Card key={cluster.clusterId} className="border-l-4 border-l-blue-500">
          <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Cluster {cluster.clusterId}</span>
                          <Badge variant="secondary">
                            {cluster.products.length} products
                          </Badge>
                        </CardTitle>
          </CardHeader>
          <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-medium">Coherence Score</Label>
                            <p className="text-lg font-semibold">{cluster.coherenceScore.toFixed(3)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Strength</Label>
                            <p className="text-lg font-semibold">{cluster.recommendationStrength.toFixed(3)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Total Quantity</Label>
                            <p className="text-lg font-semibold">{cluster.totalQuantitySold.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Avg Price</Label>
                            <p className="text-lg font-semibold">${cluster.avgUnitPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{cluster.explanation}</p>
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
                                <TableCell className="font-mono">{product.stockCode}</TableCell>
                    <TableCell>{product.description}</TableCell>
                                <TableCell>{product.quantity.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI-Powered Analysis Tab */}
        <TabsContent value="ai" className="space-y-6">
          {/* AI Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendation System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Badge 
                  variant={aiStatus === 'completed' ? 'default' : aiStatus === 'error' ? 'destructive' : 'secondary'}
                >
                  {aiStatus === 'idle' && 'Ready'}
                  {aiStatus === 'running' && 'Running...'}
                  {aiStatus === 'completed' && 'Completed'}
                  {aiStatus === 'error' && 'Error'}
                </Badge>
                {aiLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-800 text-sm">{aiError}</p>
                </div>
              )}

              {/* Quick Test Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Test (Fast Analysis)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quick-limit">Data Limit</Label>
                    <Input
                      id="quick-limit"
                      type="number"
                      value={quickTestParams.limit}
                      onChange={(e) => setQuickTestParams({...quickTestParams, limit: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-support">Min Support</Label>
                    <Input
                      id="quick-support"
                      type="number"
                      value={quickTestParams.min_support}
                      onChange={(e) => setQuickTestParams({...quickTestParams, min_support: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-clusters">Clusters</Label>
                    <Input
                      id="quick-clusters"
                      type="number"
                      value={quickTestParams.n_clusters}
                      onChange={(e) => setQuickTestParams({...quickTestParams, n_clusters: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button onClick={runQuickTest} disabled={aiLoading} className="w-full">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                  Run Quick Test
                </Button>
              </div>

              {/* Full Pipeline Section */}
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">Full Pipeline (Complete Analysis)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="full-limit">Data Limit</Label>
                    <Input
                      id="full-limit"
                      type="number"
                      value={fullPipelineParams.limit}
                      onChange={(e) => setFullPipelineParams({...fullPipelineParams, limit: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="full-support">Min Support</Label>
                    <Input
                      id="full-support"
                      type="number"
                      value={fullPipelineParams.min_support}
                      onChange={(e) => setFullPipelineParams({...fullPipelineParams, min_support: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="full-clusters">Clusters</Label>
                    <Input
                      id="full-clusters"
                      type="number"
                      value={fullPipelineParams.n_clusters}
                      onChange={(e) => setFullPipelineParams({...fullPipelineParams, n_clusters: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button onClick={runFullPipeline} disabled={aiLoading} className="w-full">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  Run Full Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Results */}
          {aiRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-blue-600">Records Processed</Label>
                      <p className="text-2xl font-bold text-blue-800">{aiRecommendations.data?.records_processed?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-green-600">Recommendations</Label>
                      <p className="text-2xl font-bold text-green-800">{aiRecommendations.data?.recommendations_generated || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-purple-600">Status</Label>
                      <p className="text-lg font-semibold text-purple-800">{aiRecommendations.success ? 'Success' : 'Failed'}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-orange-600">Message</Label>
                      <p className="text-sm text-orange-800">{aiRecommendations.message}</p>
                    </div>
                  </div>

                  {/* AI Recommendations List */}
                  {aiRecommendations.data?.recommendations && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Generated Recommendations</h4>
                      {aiRecommendations.data.recommendations.map((rec: any, index: number) => (
                        <Card key={index} className="border-l-4 border-l-green-500">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>Cluster {rec.cluster_id}</span>
                              <Badge variant="secondary">
                                {rec.products.length} products
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <Label className="text-sm font-medium">Coherence Score</Label>
                                <p className="text-lg font-semibold">{rec.coherence_score.toFixed(3)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Strength</Label>
                                <p className="text-lg font-semibold">{rec.recommendation_strength.toFixed(3)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Total Quantity</Label>
                                <p className="text-lg font-semibold">{rec.total_quantity_sold?.toLocaleString() || 'N/A'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Avg Price</Label>
                                <p className="text-lg font-semibold">${rec.avg_unit_price?.toFixed(2) || 'N/A'}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{rec.explanation}</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Stock Code</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Quantity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rec.products.map((product: any, productIndex: number) => (
                                  <TableRow key={productIndex}>
                                    <TableCell className="font-mono">{product.StockCode}</TableCell>
                                    <TableCell>{product.Description}</TableCell>
                                    <TableCell>{product.Quantity.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visualization Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Visualizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="viz-width">Width</Label>
                    <Input
                      id="viz-width"
                      type="number"
                      value={visualizationParams.figsize_width}
                      onChange={(e) => setVisualizationParams({...visualizationParams, figsize_width: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="viz-height">Height</Label>
                    <Input
                      id="viz-height"
                      type="number"
                      value={visualizationParams.figsize_height}
                      onChange={(e) => setVisualizationParams({...visualizationParams, figsize_height: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="viz-format">Format</Label>
                    <Select
                      value={visualizationParams.format}
                      onValueChange={(value: 'png' | 'jpg' | 'svg' | 'pdf') => 
                        setVisualizationParams({...visualizationParams, format: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="viz-dpi">DPI</Label>
                    <Input
                      id="viz-dpi"
                      type="number"
                      value={visualizationParams.dpi}
                      onChange={(e) => setVisualizationParams({...visualizationParams, dpi: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateDendrogram} disabled={aiStatus !== 'completed'}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Dendrogram
                  </Button>
                  <Button onClick={generateDashboard} disabled={aiStatus !== 'completed'}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Recommendations;