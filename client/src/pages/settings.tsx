import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
} from "lucide-react";
import usFlag from "@assets/generated_images/US_flag_circular_design_55844ad0.png";
import saudiFlag from "@assets/generated_images/Saudi_flag_circular_design_3c46c604.png";
import kurdishFlag from "@assets/generated_images/Kurdish_flag_circular_design_55e28463.png";

export default function SettingsPage() {
  const { language, changeLanguage, t } = useTranslation();
  const [userSettings, setUserSettings] = useState({
    // Profile Settings
    displayName: "",
    email: "",
    phone: "",

    // Language & Region (will sync with global language)
    language: language,
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
    shareLocation: false,
  });

  useEffect(() => {
    document.title = t("settings.title");
  }, [t]);

  // Sync local language state with global language state
  useEffect(() => {
    setUserSettings((prev) => ({
      ...prev,
      language: language,
    }));
  }, [language]);

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving settings:", userSettings);
    // You could show a toast notification here
    alert(t("settings.settingsSaved"));
  };

  const updateSetting = (key: string, value: any) => {
    if (key === "language") {
      // Update global language state when language is changed
      changeLanguage(value as "en" | "ar" | "kur");
    } else {
      setUserSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                data-testid="back-to-home"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("settings.backToHome")}
              </Button>
            </Link>
            <div></div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-4 w-4" />
                {t("settings.languageRegion")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.language")}</Label>
                  <Select
                    value={userSettings.language}
                    onValueChange={(value) => updateSetting("language", value)}
                  >
                    <SelectTrigger data-testid="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <img 
                            src={usFlag} 
                            alt="English"
                            className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                          />
                          <span>English</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ar">
                        <div className="flex items-center gap-2">
                          <img 
                            src={saudiFlag} 
                            alt="Arabic"
                            className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                          />
                          <span>العربية (Arabic)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="kur">
                        <div className="flex items-center gap-2">
                          <img 
                            src={kurdishFlag} 
                            alt="Kurdish"
                            className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                          />
                          <span>کوردی (Kurdish)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.currency")}</Label>
                  <Select
                    value={userSettings.currency}
                    onValueChange={(value) => updateSetting("currency", value)}
                  >
                    <SelectTrigger data-testid="currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="IQD">IQD (د.ع)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.dateFormat")}</Label>
                  <Select
                    value={userSettings.dateFormat}
                    onValueChange={(value) =>
                      updateSetting("dateFormat", value)
                    }
                  >
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
                {t("settings.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("settings.emailNotifications")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.emailNotificationsDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("emailNotifications", checked)
                    }
                    data-testid="email-notifications-switch"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {t("settings.pushNotifications")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.pushNotificationsDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("pushNotifications", checked)
                    }
                    data-testid="push-notifications-switch"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    {t("settings.favoriteUpdates")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.favoriteUpdatesDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.favoriteUpdates}
                    onCheckedChange={(checked) =>
                      updateSetting("favoriteUpdates", checked)
                    }
                    data-testid="favorite-updates-switch"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label>{t("settings.priceAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.priceAlertsDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.priceAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("priceAlerts", checked)
                    }
                    data-testid="price-alerts-switch"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-4 w-4" />
                {t("settings.displayPreferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.mapStyle")}</Label>
                <Select
                  value={userSettings.mapStyle}
                  onValueChange={(value) => updateSetting("mapStyle", value)}
                >
                  <SelectTrigger data-testid="map-style-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      {t("settings.mapStyleDefault")}
                    </SelectItem>
                    <SelectItem value="satellite">
                      {t("settings.mapStyleSatellite")}
                    </SelectItem>
                    <SelectItem value="terrain">
                      {t("settings.mapStyleTerrain")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {t("settings.showPropertyPrices")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.showPropertyPricesDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.showPropertyPrices}
                    onCheckedChange={(checked) =>
                      updateSetting("showPropertyPrices", checked)
                    }
                    data-testid="show-prices-switch"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("settings.showDistance")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.showDistanceDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.showDistance}
                    onCheckedChange={(checked) =>
                      updateSetting("showDistance", checked)
                    }
                    data-testid="show-distance-switch"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label>{t("settings.autoZoom")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.autoZoomDesc")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={userSettings.autoZoom}
                    onCheckedChange={(checked) =>
                      updateSetting("autoZoom", checked)
                    }
                    data-testid="auto-zoom-switch"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Link href="/">
              <Button variant="outline" data-testid="cancel-settings">
                {t("settings.cancel")}
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
              data-testid="save-settings"
            >
              <Save className="h-4 w-4" />
              {t("settings.saveSettings")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
