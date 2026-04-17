import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";
import { FullPageSpinner } from "@/components/FullPageSpinner";

const RootRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return (
    <Navigate
      to={role === "owner" ? "/owner/conversations" : "/chat-with-zaki"}
      replace
    />
  );
};

export default RootRedirect;
