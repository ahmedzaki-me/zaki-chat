import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";

const RootRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return (
    <Navigate
      to={user.role === "owner" ? "/owner" : "/chat-with-zaki"}
      replace
    />
  );
};

export default RootRedirect;
