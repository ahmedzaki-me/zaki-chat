import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function SettingsLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}
