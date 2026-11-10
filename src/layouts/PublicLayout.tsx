import { Outlet } from "react-router";
import { TurnstileProvider } from "@/features/auth/context/TurnstileProvider";

export function PublicLayout() {
  return (
    <TurnstileProvider>
      <Outlet />
    </TurnstileProvider>
  );
}
