import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";

export function getHomeRoute(role?: string): string {
  return role === "owner" ? "/owner" : "/chat-with-zaki";
}

const RootRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <Navigate to={getHomeRoute(user.role)} replace />;
};

export default RootRedirect;
