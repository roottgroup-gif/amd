import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function TypographyShowcase() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="display-lg crisp-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="showcase-title">
          Responsive Typography System
        </h1>
        <p className="body-lg text-muted-foreground max-w-3xl mx-auto" data-testid="showcase-description">
          A comprehensive Tailwind CSS responsive typography system featuring fluid scaling, 
          optimal readability, and seamless adaptation across all device sizes.
        </p>
      </div>

      <Separator />

      {/* Display Text Examples */}
      <Card data-testid="card-display-text">
        <CardHeader>
          <CardTitle className="heading-2">Display Text</CardTitle>
          <CardDescription>Large hero text for major headings and landing pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-display-xl">display-xl</Badge>
            <h1 className="display-xl" data-testid="text-display-xl">Hero Title</h1>
            <p className="caption">96px - 128px (fluid scaling)</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-display-lg">display-lg</Badge>
            <h1 className="display-lg" data-testid="text-display-lg">Large Display</h1>
            <p className="caption">72px - 96px (fluid scaling)</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-display-md">display-md</Badge>
            <h1 className="display-md" data-testid="text-display-md">Medium Display</h1>
            <p className="caption">56px - 72px (fluid scaling)</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-display-sm">display-sm</Badge>
            <h1 className="display-sm" data-testid="text-display-sm">Small Display</h1>
            <p className="caption">40px - 56px (fluid scaling)</p>
          </div>
        </CardContent>
      </Card>

      {/* Heading Hierarchy */}
      <Card data-testid="card-headings">
        <CardHeader>
          <CardTitle className="heading-2">Heading Hierarchy</CardTitle>
          <CardDescription>Semantic headings with responsive scaling and optimal line heights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-heading-1">h1 / heading-1</Badge>
            <h1 className="heading-1" data-testid="text-heading-1">Primary Heading</h1>
            <p className="caption">Responsive: 36px → 48px → 56px</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-heading-2">h2 / heading-2</Badge>
            <h2 className="heading-2" data-testid="text-heading-2">Secondary Heading</h2>
            <p className="caption">Responsive: 30px → 36px → 48px</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-heading-3">h3 / heading-3</Badge>
            <h3 className="heading-3" data-testid="text-heading-3">Tertiary Heading</h3>
            <p className="caption">Responsive: 24px → 30px → 36px</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-heading-4">h4 / heading-4</Badge>
            <h4 className="heading-4" data-testid="text-heading-4">Fourth Level Heading</h4>
            <p className="caption">Responsive: 20px → 24px → 30px</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-heading-5">h5 / heading-5</Badge>
            <h5 className="heading-5" data-testid="text-heading-5">Fifth Level Heading</h5>
            <p className="caption">Responsive: 18px → 20px → 24px</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-heading-6">h6 / heading-6</Badge>
            <h6 className="heading-6" data-testid="text-heading-6">Sixth Level Heading</h6>
            <p className="caption">Responsive: 16px → 18px → 20px</p>
          </div>
        </CardContent>
      </Card>

      {/* Body Text Examples */}
      <Card data-testid="card-body-text">
        <CardHeader>
          <CardTitle className="heading-2">Body Text</CardTitle>
          <CardDescription>Optimized for readability with proper line heights and content widths</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-body-xl">body-xl</Badge>
            <p className="body-xl" data-testid="text-body-xl">
              This is extra large body text designed for important introductory paragraphs 
              and lead content. It uses optimal line spacing and content width constraints 
              for enhanced readability across all devices.
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-body-lg">body-lg</Badge>
            <p className="body-lg" data-testid="text-body-lg">
              Large body text perfect for featured content, article introductions, and 
              important information that needs to stand out while maintaining excellent 
              readability and user experience.
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-body-base">body-base</Badge>
            <p className="body-base" data-testid="text-body-base">
              Standard body text that forms the foundation of most content. This size provides 
              optimal readability for extended reading sessions, with carefully balanced 
              line height and character spacing for comfortable consumption across all screen sizes.
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-body-sm">body-sm</Badge>
            <p className="body-sm" data-testid="text-body-sm">
              Small body text suitable for supporting information, captions, and secondary content. 
              Despite its smaller size, it maintains readability through proper line spacing and 
              character proportions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Typography Scale Examples */}
      <Card data-testid="card-typography-scale">
        <CardHeader>
          <CardTitle className="heading-2">Typography Scale</CardTitle>
          <CardDescription>Fluid responsive scaling with clamp() for smooth transitions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-xs">scale-xs</Badge>
              <span className="scale-xs" data-testid="text-scale-xs">Extra Small Text</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-sm">scale-sm</Badge>
              <span className="scale-sm" data-testid="text-scale-sm">Small Text</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-base">scale-base</Badge>
              <span className="scale-base" data-testid="text-scale-base">Base Text</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-lg">scale-lg</Badge>
              <span className="scale-lg" data-testid="text-scale-lg">Large Text</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-xl">scale-xl</Badge>
              <span className="scale-xl" data-testid="text-scale-xl">Extra Large Text</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-2xl">scale-2xl</Badge>
              <span className="scale-2xl" data-testid="text-scale-2xl">2X Large Text</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-20" data-testid="badge-scale-3xl">scale-3xl</Badge>
              <span className="scale-3xl" data-testid="text-scale-3xl">3X Large Text</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Text Examples */}
      <Card data-testid="card-responsive-examples">
        <CardHeader>
          <CardTitle className="heading-2">Responsive Scaling Examples</CardTitle>
          <CardDescription>Text that adapts fluidly based on viewport width</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-responsive-title">Responsive Title</Badge>
            <h2 className="text-responsive-4xl font-bold" data-testid="text-responsive-title">
              This title scales from 36px to 48px
            </h2>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-responsive-subtitle">Responsive Subtitle</Badge>
            <h3 className="text-responsive-2xl font-semibold" data-testid="text-responsive-subtitle">
              This subtitle scales from 24px to 30px
            </h3>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-responsive-body">Responsive Body</Badge>
            <p className="text-responsive-base leading-responsive-base prose-responsive" data-testid="text-responsive-body">
              This body text scales from 16px to 18px with optimal line height. The fluid 
              scaling ensures that text remains perfectly readable across all screen sizes, 
              from mobile phones to large desktop displays. The clamp() function provides 
              smooth transitions without jarring size jumps at breakpoints.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Utility Classes Examples */}
      <Card data-testid="card-utilities">
        <CardHeader>
          <CardTitle className="heading-2">Utility Classes</CardTitle>
          <CardDescription>Additional typography utilities for specific use cases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-caption">caption</Badge>
            <p className="caption" data-testid="text-caption">
              Caption text for images, tables, and supporting information
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-overline">overline</Badge>
            <p className="overline" data-testid="text-overline">Section Overline</p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-mobile">Mobile Optimized</Badge>
            <h3 className="mobile-heading-1 sm:heading-2" data-testid="text-mobile">
              Mobile-optimized heading that switches at small breakpoint
            </h3>
            <p className="mobile-body" data-testid="text-mobile-body">
              Body text optimized specifically for mobile reading experience.
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" data-testid="badge-crisp">Crisp Text</Badge>
            <p className="text-2xl crisp-text" data-testid="text-crisp">
              High DPI optimized text rendering for crisp display
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode Example */}
      <Card data-testid="card-dark-mode">
        <CardHeader>
          <CardTitle className="heading-2">Dark Mode Compatibility</CardTitle>
          <CardDescription>Typography system maintains consistency across light and dark themes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-background border rounded-lg">
            <h3 className="heading-3 mb-4" data-testid="text-dark-title">Light Theme Example</h3>
            <p className="body-base" data-testid="text-dark-body">
              The typography system automatically adapts to your theme settings while 
              maintaining all the responsive scaling and readability optimizations.
            </p>
          </div>
          
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="heading-3 mb-4" data-testid="text-muted-title">Muted Background Example</h3>
            <p className="body-base" data-testid="text-muted-body">
              Typography remains perfectly readable on different background colors 
              thanks to the semantic color system integration.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card data-testid="card-implementation">
        <CardHeader>
          <CardTitle className="heading-2">Implementation Guide</CardTitle>
          <CardDescription>How to use these typography classes in your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="heading-4" data-testid="text-impl-semantic">Semantic HTML with Typography Classes</h4>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto" data-testid="code-semantic">
{`<h1 className="heading-1">Main Page Title</h1>
<h2 className="heading-2">Section Title</h2>
<p className="body-base">Standard paragraph text</p>
<p className="caption">Image caption or metadata</p>`}
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="heading-4" data-testid="text-impl-responsive">Responsive Scaling</h4>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto" data-testid="code-responsive">
{`<h1 className="text-responsive-4xl">Fluid scaling title</h1>
<p className="text-responsive-base leading-responsive-base">
  Body text with fluid scaling
</p>`}
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="heading-4" data-testid="text-impl-display">Display Text for Heroes</h4>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto" data-testid="code-display">
{`<h1 className="display-lg crisp-text">
  Hero Section Title
</h1>
<p className="body-xl prose-responsive">
  Hero description with optimal reading width
</p>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}