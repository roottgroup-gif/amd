import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, Award, TrendingUp, Calendar, Eye, Heart, Search, 
  MessageSquare, User, Plus, Star, BarChart3 
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CustomerAnalyticsProps {
  customerId: string;
  customerName: string;
}

interface CustomerPoints {
  userId: string;
  totalPoints: number;
  currentLevel: string;
  pointsThisMonth: number;
  lastActivity: string | null;
}

interface CustomerActivity {
  id: string;
  userId: string;
  activityType: string;
  propertyId?: string | null;
  metadata: Record<string, any>;
  points: number;
  createdAt: string;
}

interface CustomerAnalytics {
  totalActivities: number;
  activitiesByType: { activityType: string; count: number; points: number }[];
  pointsHistory: { date: string; points: number }[];
  monthlyActivity: { month: string; activities: number }[];
}

const ACTIVITY_COLORS = {
  property_view: '#3b82f6',
  search: '#10b981',
  favorite_add: '#f59e0b',
  favorite_remove: '#ef4444',
  inquiry_sent: '#8b5cf6',
  login: '#06b6d4',
  profile_update: '#84cc16'
};

const ACTIVITY_ICONS = {
  property_view: Eye,
  search: Search,
  favorite_add: Heart,
  favorite_remove: Heart,
  inquiry_sent: MessageSquare,
  login: User,
  profile_update: User
};

const LEVEL_COLORS = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2'
};

export function CustomerAnalytics({ customerId, customerName }: CustomerAnalyticsProps) {
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [selectedActivityType, setSelectedActivityType] = useState('property_view');

  // Fetch customer points
  const { data: customerPoints, isLoading: pointsLoading } = useQuery<CustomerPoints>({
    queryKey: [`/api/customers/${customerId}/points`],
    enabled: !!customerId
  });

  // Fetch customer activities
  const { data: customerActivities = [], isLoading: activitiesLoading } = useQuery<CustomerActivity[]>({
    queryKey: [`/api/customers/${customerId}/activities`],
    enabled: !!customerId
  });

  // Fetch customer analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<CustomerAnalytics>({
    queryKey: [`/api/customers/${customerId}/analytics`],
    enabled: !!customerId
  });

  const addCustomerActivity = async () => {
    try {
      await apiRequest(`/api/customers/${customerId}/activity`, {
        method: 'POST',
        body: JSON.stringify({
          activityType: selectedActivityType,
          points: pointsToAdd,
          metadata: {
            source: 'admin_dashboard',
            timestamp: new Date().toISOString()
          }
        })
      });

      // Invalidate and refetch all customer data
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/points`] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/analytics`] });

      setPointsToAdd(0);
    } catch (error) {
      console.error('Failed to add customer activity:', error);
    }
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActivityIcon = (type: string) => {
    const IconComponent = ACTIVITY_ICONS[type as keyof typeof ACTIVITY_ICONS] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (pointsLoading || activitiesLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {customerPoints?.totalPoints || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              style={{ 
                backgroundColor: LEVEL_COLORS[customerPoints?.currentLevel as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.Bronze,
                color: 'white'
              }}
            >
              {customerPoints?.currentLevel || 'Bronze'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customerPoints?.pointsThisMonth || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.totalActivities || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Points Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Customer Activity
          </CardTitle>
          <CardDescription>
            Award points to {customerName} for their engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <select 
                id="activity-type"
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="property_view">Property View</option>
                <option value="search">Search</option>
                <option value="favorite_add">Favorite Added</option>
                <option value="inquiry_sent">Inquiry Sent</option>
                <option value="login">Login</option>
                <option value="profile_update">Profile Update</option>
              </select>
            </div>
            <div>
              <Label htmlFor="points">Points to Award</Label>
              <Input
                id="points"
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                data-testid="input-points-to-add"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addCustomerActivity}
                className="w-full"
                data-testid="button-add-activity"
              >
                Add Activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activities by Type Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activities by Type</CardTitle>
                <CardDescription>Breakdown of customer engagement activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.activitiesByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${formatActivityType(name)}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics?.activitiesByType?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={ACTIVITY_COLORS[entry.activityType as keyof typeof ACTIVITY_COLORS] || '#8884d8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Points by Activity Type */}
            <Card>
              <CardHeader>
                <CardTitle>Points by Activity Type</CardTitle>
                <CardDescription>Points earned from different activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.activitiesByType || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="activityType"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatActivityType}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatActivityType(value as string)}
                      formatter={(value) => [`${value} points`, 'Points']}
                    />
                    <Bar dataKey="points" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest customer engagement activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {customerActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        {getActivityIcon(activity.activityType)}
                      </div>
                      <div>
                        <div className="font-medium">{formatActivityType(activity.activityType)}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      +{activity.points} points
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Points History Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Points History (Last 30 Days)</CardTitle>
                <CardDescription>Daily points earned over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.pointsHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="points" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Activity Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity Trend</CardTitle>
                <CardDescription>Activity levels over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.monthlyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="activities" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Activity History</CardTitle>
              <CardDescription>Detailed log of all customer activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Activity</th>
                      <th className="text-left p-2">Points</th>
                      <th className="text-left p-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerActivities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{formatDate(activity.createdAt)}</td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            {getActivityIcon(activity.activityType)}
                            <span>{formatActivityType(activity.activityType)}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">+{activity.points}</Badge>
                        </td>
                        <td className="p-2 text-gray-500">
                          {activity.propertyId ? `Property: ${activity.propertyId.substring(0, 8)}...` : 'General activity'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}