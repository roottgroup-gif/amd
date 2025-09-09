import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Globe, 
  Bell, 
  Monitor, 
  Save,
  Eye,
  MapPin,
  Heart,
  Mail,
  ArrowLeft
} from "lucide-react";

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState({
    // Profile Settings
    displayName: "",
    email: "",
    phone: "",
    
    // Language & Region
    language: "en",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    favoriteUpdates: true,
    priceAlerts: false,
    
    // Display Preferences
    mapStyle: "default",
    showPropertyPrices: true,
    showDistance: true,
    autoZoom: true,
    
    // Privacy
    showProfile: true,
    shareLocation: false
  });

  useEffect(() => {
    document.title = "Settings - EstateAI";
  }, []);

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving settings:", userSettings);
    // You could show a toast notification here
    alert("Settings saved successfully!");
  };

  const updateSetting = (key: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="back-to-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Profile Information
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-4 w-4" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={userSettings.language} onValueChange={(value) => updateSetting('language', value)}>
                    <SelectTrigger data-testid="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="ku">کوردی (Kurdish)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={userSettings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                    <SelectTrigger data-testid="currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="IQD">IQD (د.ع)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={userSettings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
                    <SelectTrigger data-testid="date-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={userSettings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  data-testid="email-notifications-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Browser notifications</p>
                </div>
                <Switch
                  checked={userSettings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  data-testid="push-notifications-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Favorite Property Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when favorite properties change</p>
                </div>
                <Switch
                  checked={userSettings.favoriteUpdates}
                  onCheckedChange={(checked) => updateSetting('favoriteUpdates', checked)}
                  data-testid="favorite-updates-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Price Drop Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert when property prices drop</p>
                </div>
                <Switch
                  checked={userSettings.priceAlerts}
                  onCheckedChange={(checked) => updateSetting('priceAlerts', checked)}
                  data-testid="price-alerts-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-4 w-4" />
                Display Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Map Style</Label>
                <Select value={userSettings.mapStyle} onValueChange={(value) => updateSetting('mapStyle', value)}>
                  <SelectTrigger data-testid="map-style-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Show Property Prices
                  </Label>
                  <p className="text-sm text-muted-foreground">Display prices on map markers</p>
                </div>
                <Switch
                  checked={userSettings.showPropertyPrices}
                  onCheckedChange={(checked) => updateSetting('showPropertyPrices', checked)}
                  data-testid="show-prices-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Show Distance
                  </Label>
                  <p className="text-sm text-muted-foreground">Show distance from your location</p>
                </div>
                <Switch
                  checked={userSettings.showDistance}
                  onCheckedChange={(checked) => updateSetting('showDistance', checked)}
                  data-testid="show-distance-switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Zoom to Results</Label>
                  <p className="text-sm text-muted-foreground">Automatically zoom map to show search results</p>
                </div>
                <Switch
                  checked={userSettings.autoZoom}
                  onCheckedChange={(checked) => updateSetting('autoZoom', checked)}
                  data-testid="auto-zoom-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Link href="/">
              <Button variant="outline" data-testid="cancel-settings">
                Cancel
              </Button>
            </Link>
            <Button onClick={handleSave} className="flex items-center gap-2" data-testid="save-settings">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}