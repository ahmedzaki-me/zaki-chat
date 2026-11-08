import { type User } from "@/shared/types";

const USER_KEY = "Zaki-chat-user";

export const storage = {
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),

  clearUser() {
    localStorage.removeItem(USER_KEY);
  },
};
