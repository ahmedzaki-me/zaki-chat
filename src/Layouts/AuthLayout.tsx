import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/components/FullPageSpinner";
export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};
