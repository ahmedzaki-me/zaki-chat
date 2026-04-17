import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/components/FullPageSpinner";

import { useOneSignal } from "@/hooks/useOneSignal";

export const UserLayout = () => {
  const { user, loading } = useAuth();
  useOneSignal();
  
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;

  return <Outlet />;
};
