import { TypographyShowcase } from "@/components/typography-showcase";
import { SEOHead } from "@/components/SEOHead";

export default function TypographyShowcasePage() {
  return (
    <>
      <SEOHead 
        title="Typography Showcase - Responsive Design System"
        description="Comprehensive demonstration of the responsive typography system featuring fluid scaling, optimal readability, and seamless adaptation across all device sizes."
      />
      <div className="min-h-screen bg-background" data-testid="page-typography-showcase">
        <TypographyShowcase />
      </div>
    </>
  );
}