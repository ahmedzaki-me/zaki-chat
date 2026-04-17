import { createBrowserRouter, redirect } from "react-router";

import { AuthLayout } from "./Layouts/AuthLayout";
import { OwnerLayout } from "./Layouts/OwnerLayout";
import { UserLayout } from "./Layouts/UserLayout";

import RootRedirect from "./Layouts/RootRedirect";

import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

import  ConversationsPage  from "./pages/owner/ConversationsPage";
import { ConversationPage } from "./pages/owner/ConversationPage";

import { ChatPage } from "./pages/user/ChatPage";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRedirect,
  },
  {
    path: "/auth",
    Component: AuthLayout,
    children: [
      { index: true, loader: () => redirect("/auth/login") },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
    ],
  },
  {
    path: "/owner",
    Component: OwnerLayout,
    children: [
      { index: true, path: "conversations", Component: ConversationsPage },
      { path: ":conversationId", Component: ConversationPage },
    ],
  },
  {
    path: "/chat-with-zaki",
    Component: UserLayout,
    children: [{ index: true, Component: ChatPage }],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
