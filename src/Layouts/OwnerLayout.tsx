import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";


export const OwnerLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role !== "owner") return <Navigate to="/chat-with-zaki" replace />;

  return <OwnerLayoutInner />;
};

const OwnerLayoutInner = () => {
  return <Outlet />;
};
