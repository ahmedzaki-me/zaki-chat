import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";
import { getHomeRoute } from "@/layouts/RootRedirect";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";

export const AuthLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to={getHomeRoute(user.role)} replace />;

  return (
    <div className="relative flex min-h-svh flex-col justify-between overflow-x-hidden bg-background text-foreground">
      {/* Decorative ambient purple glow - calmed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-80 w-full max-w-3xl -translate-x-1/2 rounded-full bg-primary/5 blur-[90px]"
      />

      <LandingHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <LandingFooter />
    </div>
  );
};
