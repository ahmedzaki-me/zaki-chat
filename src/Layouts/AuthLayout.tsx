import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";
export const AuthLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};
