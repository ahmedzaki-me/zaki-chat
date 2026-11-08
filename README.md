# 💬 Zaki Chat — Real-Time Messaging Platform (v2.0.0)

> **Version 2.0.0** — A complete architectural overhaul featuring a modular Feature-Driven architecture, dedicated REST & Socket.IO real-time engine with centralized reconnection handling, multimedia messaging with IndexedDB caching, Web Push notifications, and end-to-end OpenAPI type safety.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-chat.ahmedzaki.me-blue?style=for-the-badge)](https://chat.ahmedzaki.me)
[![Portfolio](https://img.shields.io/badge/Portfolio-ahmedzaki.me-green?style=for-the-badge)](https://ahmedzaki.me)
[![Version](https://img.shields.io/badge/Release-v2.0.0-purple?style=for-the-badge)](https://github.com/ahmedzaki-me/zaki-chat)

---

## 🚀 What's New in Version 2.0.0

- 🏛️ **Feature-Driven Architecture** — Fully modularized codebase organized strictly by domain (`auth`, `chat`, `conversations`, `notifications`, `presence`, `settings`).
- ⚡ **Pure Socket.IO Engine** — Migrated from BaaS to a dedicated REST & Socket.IO backend with centralized reconnect synchronization and TanStack Query cache invalidation.
- 📐 **End-to-End OpenAPI Typing** — Domain models and API contracts directly bound to OpenAPI 3.0 generated schemas.
- 🎙️ **Rich Multimedia Messaging** — Real-time audio voice recording with waveform visualization, client-side WebP image compression, custom video player, and file downloads.
- 💾 **IndexedDB Media & Query Persistence** — Client-side blob caching for media assets and persisted TanStack Query cache for instant app launches and offline resilience.
- 🔔 **PWA & Web Push Notifications** — Custom Workbox service worker (`injectManifest`), VAPID Web Push, and installable PWA support.
- 🛡️ **Hardened Auth & Bot Protection** — Cloudflare Turnstile integration, silent JWT session refresh with auto-retry, and guest-to-permanent account upgrades.

---

## ✨ Features

### For Visitors (Users)
- 🎭 **Instant Guest Access** — Start chatting right away with just a nickname, no initial email required.
- 📧 **Account Upgrade** — Seamlessly convert a guest session into a permanent registered account without losing history.
- ⚡ **Real-Time Delivery** — Sub-second message delivery powered by Socket.IO.
- 🎙️ **Voice Notes** — Record and send voice messages with interactive audio waveform visualization.
- 📷 **Media Sharing** — Send photos (with client-side WebP compression), videos, and files.
- ↩️ **Reply & Quotes** — Swipe or click to quote and jump to replied messages with smooth scrolling and highlights.
- ✏️ **Edit & Delete** — Edit sent messages or remove them with real-time UI updates.
- 😃 **Message Reactions** — React to any message with emojis.
- ✅ **Delivery & Read Receipts** — WhatsApp-style sent, delivered, and read status indicators.
- 🔔 **Web Push Notifications** — Receive push notifications even when the browser tab or app is closed.

### For the Owner
- 🟢 **Live Presence & Typing** — Real-time online/away status and typing indicators across all active conversations.
- 📋 **Conversation Management** — Manage, pin, search, and clear conversations from a unified inbox.
- 🗑️ **Permanent Moderation Deletion** — Ability to permanently delete messages across both parties.
- ⚙️ **Profile & Sessions** — Multi-device active session revocation, profile customization, and avatar square-cropping.

---

## 🛠️ Tech Stack

### Frontend Core
| Category | Technologies |
| --- | --- |
| **Framework & Language** | React 19, TypeScript, Vite 8 |
| **Styling & Components** | Tailwind CSS v4, shadcn/ui, Radix UI, Lucide React |
| **Routing** | React Router v7 |
| **Data Fetching & State** | TanStack Query v5 + Async Storage Persister (IndexedDB) |
| **Real-Time Engine** | Socket.IO Client v4 |
| **PWA & Offline** | Vite Plugin PWA, Workbox (`injectManifest`) |
| **Forms & Validation** | React Hook Form, Zod |
| **Security & Utilities** | Cloudflare Turnstile, date-fns, sonner, browser-image-compression |

---

## 📁 Project Structure

```
src/
├── core/                        # Core application infrastructure
│   ├── http/                    # Axios client, auth interceptors & token refresh
│   ├── pwa/                     # PWA registration & service worker (sw.ts)
│   ├── socket/                  # Socket.IO client instance & event types
│   └── theme/                   # Theme provider (Dark / Light / System)
├── features/                    # Feature-Driven modular domains
│   ├── auth/                    # Login, signup, guest access, token management
│   ├── chat/                    # Bubbles, input, media, video, hooks & audio
│   │   ├── components/          # MessageBubble, MessageInput, DateSeparator
│   │   ├── hooks/               # useChatMessages, useChatScroll, useMarkRead
│   │   └── utils/               # downloadMedia, processImage, chat.grouping
│   ├── conversations/           # Inbox list, conversation items, search
│   ├── notifications/           # Web push subscriptions, push effects
│   ├── presence/                # Online/offline status, typing indicators
│   └── settings/                # Profile, avatar upload/delete dialogs, sessions
├── layouts/                     # Route layout wrappers (Auth, User, Owner)
└── shared/                      # Shared primitives, UI components, types
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A running [Zaki Chat Backend](https://github.com/ahmedzaki-me) instance (REST & Socket.IO)
- Cloudflare Turnstile Site Key (for bot protection)

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
# Production backend API base URL
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1/

# Cloudflare Turnstile site key
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key

# Optional: Override Socket.IO URL (defaults to VITE_API_BASE_URL origin)
# VITE_SOCKET_URL=https://api.yourdomain.com

# Optional: Cache version buster
# VITE_APP_VERSION=2.0.0
```

### Development & Build Commands

```bash
# Start local development server
npm run dev

# Type-check and build for production
npm run build

# Preview production build locally (with Service Worker)
npm run preview

# Run ESLint
npm run lint

# Regenerate TypeScript schemas from backend OpenAPI spec
npm run generate:types
```

---

## 👨‍💻 Author

**Ahmed Zaki** — Front-End Engineer
- Portfolio: [ahmedzaki.me](https://ahmedzaki.me)
- LinkedIn: [linkedin.com/in/ahmedzaki-me](https://www.linkedin.com/in/ahmedzaki-me)
- GitHub: [github.com/ahmedzaki-me](https://github.com/ahmedzaki-me)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
