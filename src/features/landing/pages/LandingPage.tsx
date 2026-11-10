import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";
import { getHomeRoute } from "@/layouts/RootRedirect";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { CtaSection } from "@/features/landing/components/CtaSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background text-foreground">
      {/* Decorative subtle ambient purple glow - calmed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-80 w-full max-w-3xl -translate-x-1/2 rounded-full bg-primary/5 blur-[90px]"
      />

      <LandingHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-14 px-4 pt-6 pb-12 sm:gap-20 sm:px-6 sm:pt-12 sm:pb-16">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
