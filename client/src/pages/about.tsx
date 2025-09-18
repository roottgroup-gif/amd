import { ArrowLeft, Brain, Users, Headphones, Shield, Award, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { SEOHead } from "@/components/SEOHead";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SEOHead
        title={`${t('about.title')} | MapEstate - AI-Powered Real Estate Platform`}
        description={`${t('about.subtitle')} Learn about our mission to revolutionize real estate in Kurdistan, Iraq with AI-powered property search and expert agent services.`}
        keywords="about MapEstate, AI real estate platform, Kurdistan Iraq property platform, real estate technology, property search innovation, digital real estate solutions"
        canonicalUrl={undefined}
        ogImage={`${window.location.origin}/mapestate-og-image.jpg`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' }
        ]}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                data-testid="button-back-home"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('about.backToHome')}
              </Button>
            </Link>
            <Badge 
              variant="secondary" 
              className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
            >
              MapEstate
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-left space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white" data-testid="text-about-title">
            {t('about.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl" data-testid="text-about-subtitle">
            {t('about.subtitle')}
          </p>
        </section>

        {/* Mission Section */}
        <section className="max-w-4xl mx-auto">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="text-left">
              <CardTitle className="text-3xl text-gray-900 dark:text-white flex items-center gap-2" data-testid="text-mission-title">
                <Shield className="h-8 w-8 text-orange-600" />
                {t('about.ourMission')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-left" data-testid="text-mission-content">
                {t('about.missionText')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="text-left">
              <CardTitle className="text-3xl text-gray-900 dark:text-white" data-testid="text-story-title">
                {t('about.ourStory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-left" data-testid="text-story-content">
                {t('about.storyText')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-left text-gray-900 dark:text-white" data-testid="text-values-title">
            {t('about.ourValues')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-left">
                <Shield className="h-12 w-12 text-blue-600 mb-2" />
                <CardTitle className="text-xl text-gray-900 dark:text-white" data-testid="text-value-transparency">
                  {t('about.valueTransparency')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 text-left" data-testid="text-value-transparency-desc">
                  {t('about.valueTransparencyText')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-left">
                <Lightbulb className="h-12 w-12 text-yellow-600 mb-2" />
                <CardTitle className="text-xl text-gray-900 dark:text-white" data-testid="text-value-innovation">
                  {t('about.valueInnovation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 text-left" data-testid="text-value-innovation-desc">
                  {t('about.valueInnovationText')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-left">
                <Award className="h-12 w-12 text-green-600 mb-2" />
                <CardTitle className="text-xl text-gray-900 dark:text-white" data-testid="text-value-excellence">
                  {t('about.valueExcellence')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 text-left" data-testid="text-value-excellence-desc">
                  {t('about.valueExcellenceText')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-left text-gray-900 dark:text-white" data-testid="text-why-choose-title">
            {t('about.whyChooseUs')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-left">
                <Brain className="h-12 w-12 text-orange-600 mb-2" />
                <CardTitle className="text-xl text-gray-900 dark:text-white" data-testid="text-feature-ai">
                  {t('about.featureAI')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 text-left" data-testid="text-feature-ai-desc">
                  {t('about.featureAIText')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-left">
                <Users className="h-12 w-12 text-blue-600 mb-2" />
                <CardTitle className="text-xl text-gray-900 dark:text-white" data-testid="text-feature-local">
                  {t('about.featureLocal')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 text-left" data-testid="text-feature-local-desc">
                  {t('about.featureLocalText')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="text-left">
                <Headphones className="h-12 w-12 text-green-600 mb-2" />
                <CardTitle className="text-xl text-gray-900 dark:text-white" data-testid="text-feature-support">
                  {t('about.featureSupport')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 text-left" data-testid="text-feature-support-desc">
                  {t('about.featureSupportText')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-left bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-contact-title">
            {t('about.contactUs')}
          </h2>
          <p className="text-xl mb-6 opacity-90" data-testid="text-contact-content">
            {t('about.contactText')}
          </p>
          <Link href="/">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-gray-100"
              data-testid="button-contact-home"
            >
              {t('about.backToHome')}
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}