// contexts/UsersStatusContext.tsx
import { createContext, useContext } from "react";

export interface PresenceUser {
  user_id: string;
  user_name: string;
  is_typing: boolean;
  online_at: string;
  is_focused: boolean; 
  status: "away" | "online" | "offline"
}
export type UsersStatusMap = Record<string, PresenceUser>;

interface UsersStatusContextType {
  usersStatus: UsersStatusMap;
}

export const UsersStatusContext = createContext<UsersStatusContextType | null>(
  null,
);

export function useUsersStatus() {
  const context = useContext(UsersStatusContext);
  if (!context)
    throw new Error("useUsersStatus must be used within UsersStatusProvider");
  return context;
}
