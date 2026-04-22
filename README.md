# 💬 Zaki Chat — Real-Time Anonymous Messaging

> A production-grade real-time chat application where anyone can reach you — no sign-up required.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-chat.ahmedzaki.me-blue?style=for-the-badge)](https://chat.ahmedzaki.me)
[![Portfolio](https://img.shields.io/badge/Portfolio-ahmedzaki.me-green?style=for-the-badge)](https://ahmedzaki.me)
[![Project Page](https://img.shields.io/badge/Project%20Page-View%20Details-orange?style=for-the-badge)](https://ahmedzaki.me/projects/zaki-chat-realtime-messaging)

---

## 🎯 The Problem This Solves

How many potential clients or collaborators hesitated to reach out because they didn't want to expose their identity, use a real email, or go through a lengthy sign-up process?

Zaki Chat eliminates that friction. Anyone can start a real conversation with just a name — no account, no commitment. If the conversation is worth continuing, they can optionally register to resume it from any device, any time.

---

## ✨ Features

### For Visitors (Users)

- 🎭 **Guest Login** — Enter any name and start chatting instantly, no email required
- 📧 **Optional Registration** — Upgrade to an account mid-conversation to preserve history and access it from other devices
- ⚡ **Real-Time Messaging** — Instant message delivery powered by Supabase Realtime
- ✅ **Read Receipts** — WhatsApp-style seen indicators
- 🔔 **Push Notifications** — Never miss a reply, even when the tab is closed
- ↩️ **Reply to Messages** — Swipe to reply, just like modern messaging apps
- 📜 **Infinite Scroll** — Load conversation history seamlessly with cursor-based pagination

### For the Owner

- 🟢 **Presence Tracking** — See who's online, away, or offline in real time
- 🗑️ **Soft Delete** — Delete messages on your end; guests only see their own content
- 🔔 **Instant Notifications** — Get notified the moment someone sends a message

### Security & UX

- 🛡️ **Cloudflare Turnstile** — Bot protection on login and guest access
- 🔐 **Row-Level Security** — Supabase RLS policies enforced at the database level
- 🌓 **Dark / Light Mode** — Theme support out of the box
- ⚡ **Optimistic UI** — Messages appear instantly before server confirmation

---

## 🛠️ Tech Stack

### Frontend

| Category      | Technologies                                       |
| ------------- | -------------------------------------------------- |
| Core          | React 19, Vite, TypeScript                         |
| Styling       | Tailwind CSS v4, shadcn/ui, Radix UI, Lucide React |
| Routing       | React Router v7                                    |
| Data Fetching | TanStack Query v5 (React Query)                    |
| Forms         | React Hook Form, Zod                               |
| Animation     | Framer Motion v12                                  |
| Utilities     | date-fns, next-themes                              |

### Backend & Services

| Category            | Technologies                      |
| ------------------- | --------------------------------- |
| Database            | Supabase (PostgreSQL)             |
| Auth                | Supabase Auth (anonymous + email) |
| Real-Time           | Supabase Realtime                 |
| Server Logic        | Supabase Edge Functions           |
| Notifications       | OneSignal                         |
| Bot Protection      | Cloudflare Turnstile              |
| Toast Notifications | Sonner                            |

### Infrastructure

| Category  | Technologies     |
| --------- | ---------------- |
| Hosting   | Cloudflare Pages |
| CDN & DNS | Cloudflare       |

---

## 🏗️ Architecture Highlights

- **Anonymous → Email Upgrade Flow** — Users can seamlessly convert a guest session into a permanent account without losing chat history
- **Cursor-Based Pagination** — Efficient infinite scroll that doesn't re-fetch already-loaded messages
- **Optimistic Updates** — `useMutation` with `onMutate`/`onError` rollback for instant perceived performance
- **Presence System** — Real-time online/away/offline tracking via Supabase Realtime presence channels
- **Keep-Alive on Close** — `fetch` with `keepalive: true` updates `last_seen` even when the browser tab is closed
- **PostgreSQL Views** — Soft-delete implemented via a database view; owner and guest see different versions of the same conversation
- **REPLICA IDENTITY FULL** — Configured on relevant tables to ensure Supabase Realtime fires correctly on DELETE events

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [OneSignal](https://onesignal.com) app
- A [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) site key

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmedzaki-me/zaki-chat.git
cd zaki-chat

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
VITE_ONESIGNAL_APP_ID=your_onesignal_app_id
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### Run Locally

```bash
npm run dev
```

---

## 📁 Project Structure

```
├── public/
├── src/
│   ├── assets/                  # Static assets (images, icons, fonts)
│   ├── components/
│   │   ├── chat/                # Chat-specific components
│   │   ├── ui/                  # shadcn/ui base components
│   │   ├── FullPageSpinner.tsx
│   │   ├── GuestLogin.tsx
│   │   ├── login-form.tsx
│   │   ├── ModeSwitch.tsx
│   │   ├── signup-form.tsx
│   │   ├── SubscribeSwitch.tsx
│   │   └── UserUpgrade.tsx
│   ├── context/                 # React context providers (Auth, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── Layouts/                 # Layout wrapper components
│   ├── lib/
│   │   ├── auth.ts              # Auth helpers
│   │   ├── queryClient.ts       # TanStack Query client setup
│   │   ├── sounds.ts            # Notification sound utilities
│   │   ├── supabase.ts          # Supabase client initialization
│   │   └── utils.ts             # Shared utility functions
│   |── pages/ ...
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── routes.tsx           # React Router route definitions
|
├── supabase/                # Supabase config & Edge Functions
├── .env
├── index.html
├── vite.config.ts
└── tsconfig.json
```

---

## 📸 Screenshots

> Live demo available at [chat.ahmedzaki.me](https://chat.ahmedzaki.me)
>
> **Demo credentials:** Use "Guest Login" — just enter any name to get started.

---
 
## 🧠 What I Learned
 
This is my first TypeScript project. Most of the underlying stack — Supabase (RLS, Realtime, Edge Functions), TanStack Query (optimistic updates, cache invalidation), push notifications with a custom service worker, and production-grade auth patterns — I had already worked with in a previous project ([Zaki Dashboard](https://ahmedzaki.me)). Zaki Chat pushed me to apply all of that with TypeScript for the first time, which forced a deeper understanding of types across async flows, Supabase responses, and complex component state.
 
---

## 👨‍💻 Author

**Ahmed Zaki** — Front-End Developer

[![Portfolio](https://img.shields.io/badge/Portfolio-ahmedzaki.me-blue)](https://ahmedzaki.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/ahmedzaki-me)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?logo=github)](https://github.com/ahmedzaki-me)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
