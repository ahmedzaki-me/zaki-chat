import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getCurrentUser, supabase } from "@/lib/supabase";

export interface User extends SupabaseUser {
  full_name?: string;
  role?: string;
  id: string;
  conversation_id: string;
  avatar_url: string;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshFullUserData = async () => {
    const fullData = await getCurrentUser();
    setUser((prev) => {
      if (!fullData) return prev;
      if (prev?.id === fullData.id && prev?.email === fullData.email)
        return prev;
      return fullData;
    });
    setLoading(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession) {
          await refreshFullUserData();
        } else {
          setUser(undefined);
        }
      } catch (e) {
        console.error("Auth Error: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          refreshFullUserData();
        }
      } else {
        setUser(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const role: string | undefined = user?.role;

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
};
