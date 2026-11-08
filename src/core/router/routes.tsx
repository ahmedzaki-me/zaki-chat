import { createBrowserRouter, redirect } from "react-router";
import { FullPageSpinner } from "@/shared/components/feedback/FullPageSpinner";

export const router = createBrowserRouter([
  {
    path: "/",
    HydrateFallback: FullPageSpinner,

    lazy: async () => {
      const { default: Component } = await import("@/layouts/RootRedirect");

      return {
        Component,
      };
    },
  },

  {
    path: "/settings",
    HydrateFallback: FullPageSpinner,

    lazy: async () => {
      const { SettingsLayout } = await import("@/layouts/SettingsLayout");
      return { Component: SettingsLayout };
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import("@/features/settings/pages/SettingsPage");
          return { Component };
        },
      },
    ],
  },

  {
    path: "/auth",
    HydrateFallback: FullPageSpinner,

    lazy: async () => {
      const { AuthLayout } = await import("@/layouts/AuthLayout");

      return {
        Component: AuthLayout,
      };
    },
    children: [
      {
        index: true,
        loader: () => redirect("/auth/login"),
      },
      {
        path: "login",
        lazy: async () => {
          const { default: Component } = await import("@/features/auth/pages/LoginPage");

          return { Component };
        },
      },
      {
        path: "signup",
        lazy: async () => {
          const { default: Component } =
            await import("@/features/auth/pages/SignupPage");

          return { Component };
        },
      },
    ],
  },

  {
    path: "/owner",
    HydrateFallback: FullPageSpinner,

    lazy: async () => {
      const { OwnerLayout } = await import("@/layouts/OwnerLayout");

      return {
        Component: OwnerLayout,
      };
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Component } =
            await import("@/features/conversations/pages/ConversationsPage");

          return { Component };
        },
      },
      {
        path: ":conversationId",
        lazy: async () => {
          const { ConversationPage } =
            await import("@/features/conversations/pages/ConversationPage");

          return {
            Component: ConversationPage,
          };
        },
      },
    ],
  },

  {
    path: "/chat-with-zaki",
    HydrateFallback: FullPageSpinner,

    lazy: async () => {
      const { UserLayout } = await import("@/layouts/UserLayout");

      return {
        Component: UserLayout,
      };
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { ChatPage } = await import("@/features/chat/pages/ChatPage");

          return {
            Component: ChatPage,
          };
        },
      },
    ],
  },

  {
    path: "*",
    HydrateFallback: FullPageSpinner,

    lazy: async () => {
      const { default: Component } = await import("@/core/router/NotFoundPage");

      return {
        Component,
      };
    },
  },
]);
