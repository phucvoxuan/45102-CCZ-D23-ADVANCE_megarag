import {
  ParticleBackground,
  LandingHero,
  LogoCloud,
  LandingFeatures,
  LandingHowItWorks,
  LandingTestimonials,
  LandingPricing,
  LandingFAQ,
  LandingCTA,
  LandingFooter,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Animated particle background */}
      <ParticleBackground />

      {/* Main content */}
      <div className="relative z-10">
        <LandingHero />
        <LogoCloud />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
