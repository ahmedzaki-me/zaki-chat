import { createContext } from "react";
import type { User } from "./AuthProvider";

type AuthContextTypes = {
  user?: User;
  role?: string;
  loading?: boolean;
};
export const AuthContext = createContext<AuthContextTypes>({});
