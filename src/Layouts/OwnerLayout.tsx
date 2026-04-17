import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { FullPageSpinner } from "@/components/FullPageSpinner";

import { useConversationsRealtime } from "@/hooks/useConversationsRealtime";
import { useProfilesRealtime } from "@/hooks/useProfilesRealtime";

import { UsersStatusProvider } from "@/context/UsersStatusProvider";
import { useOneSignal } from "@/hooks/useOneSignal";

export const OwnerLayout = () => {
  const { user, role, loading } = useAuth();
  
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (role !== "owner") return <Navigate to="/chat-with-zaki" replace />;

  return <OwnerLayoutInner />;
};

const OwnerLayoutInner = () => {
  useConversationsRealtime();
  useProfilesRealtime();
  useOneSignal();

  return (
    <UsersStatusProvider>
      <Outlet />
    </UsersStatusProvider>
  );
};
