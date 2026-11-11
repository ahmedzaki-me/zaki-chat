# ⚡ Zaki Chat - Real-time Socket.IO API Reference

This document provides a comprehensive technical reference for the real-time bidirectional communication layer of **Zaki Chat**, built with **Socket.IO v4** over WebSocket transport.

For interactive visualization and machine-readable specification, see:
- **Interactive AsyncAPI UI:** `http://localhost:3000/docs/socket`
- **Machine-readable Spec:** [`docs/asyncapi.yaml`](./asyncapi.yaml)

---

## 🔌 Connection & Handshake Authentication

The Socket.IO server exclusively accepts WebSocket connections (`transports: ["websocket"]`). The client must provide a valid JWT access token in the `auth` payload during handshake:

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  auth: {
    token: accessToken, // Short-lived JWT (15-min TTL)
  },
});

socket.on("connect", () => {
  console.log("Connected to real-time gateway with ID:", socket.id);
});

socket.on("connect_error", async (err: any) => {
  // If token is expired, refresh via REST API and reconnect
  if (err.data?.code === "TOKEN_EXPIRED") {
    const res = await fetch("/api/v1/auth/refresh", { method: "POST" });
    const { accessToken } = await res.json();
    socket.auth.token = accessToken;
    socket.connect();
  }
});
```

---

## 🏛️ Architecture & Room Structure

Upon successful handshake, the socket automatically joins dedicated rooms according to authentication claims:

1. **`user:<userId>`**: Joined by all sockets belonging to this user account across all devices. Used for delivering personal updates (e.g., incoming messages, conversation receipts).
2. **`session:<sessionId>`**: Joined by all sockets belonging to this active login session. If a session is revoked or a refresh token is stolen/replayed, all sockets in this room are immediately disconnected.
3. **`owner`**: Joined strictly by accounts with the `owner` role. Receives real-time user presence transitions, unread alerts, and new user notifications.

---

## ⏱️ Real-time Event Rate Limiting

Rate limiting is evaluated in memory **first** (before checking session activity in MongoDB) per socket connection in fixed **10-second windows** (`src/realtime/rate-limit.config.ts` and `src/realtime/handler.ts`), so throttled events never hit the database:

| Category | Targeted Events | Window | Max Events | Exceeding Behavior |
| :--- | :--- | :---: | :---: | :--- |
| **`message`** | `message:send`, `message:edit`, `message:delete`, `message:delete-permanent`, `reaction:add`, `reaction:remove` | 10s | **30** | Returns `{ ok: false, error: ProblemDetails }` with `429 RATE_LIMITED`. Socket remains connected. |
| **`read`** | `conversation:read` | 10s | **60** | Returns `{ ok: false, error: ProblemDetails }` with `429 RATE_LIMITED`. |
| **`typing`** | `typing` | 10s | **40** | **Silent Drop**: Returns `{ ok: true, data: null }` acknowledgment, but drops the event without forwarding to the peer. |
| **`other`** | `conversation:clear`, `app:visibility` | 10s | **20** | Returns `{ ok: false, error: ProblemDetails }` with `429 RATE_LIMITED`. |

---

## 📤 Client-to-Server Events (Publish)

All client events accept an acknowledgment callback in the form:
- **Success:** `{ ok: true, data: <Payload> }`
- **Failure:** `{ ok: false, error: <RFC 7807 ProblemDetails> }`

### 1. `message:send`
Sends a new text message, media attachment, or voice note.
- **Permission:** Owner or conversation participant.
- **Rate Limit:** 30 / 10s (`message` group).
- **Payload:**
  ```json
  {
    "conversationId": "6543210987abcdef01234567",
    "text": "Hello world",
    "attachment": {
      "key": "chat-media/.../uuid.webp",
      "kind": "image",
      "size": 1048576,
      "originalName": "photo.webp"
    },
    "replyToId": "6543210987abcdef01234560"
  }
  ```
- **Acknowledgment:** `{ ok: true, data: { message: MessageDto } }`

### 2. `message:edit`
Edits the text of an existing message.
- **Permission:** Message author only.
- **Rate Limit:** 30 / 10s (`message` group).
- **Payload:** `{ "id": "<messageId>", "text": "Updated text" }`
- **Acknowledgment:** `{ ok: true, data: { message: MessageDto } }`

### 3. `message:delete`
Soft-deletes a message. Content becomes `null` for ordinary users while the Owner retains inspection capability.
- **Permission:** Message author or Owner.
- **Rate Limit:** 30 / 10s (`message` group).
- **Payload:** `{ "id": "<messageId>" }`
- **Acknowledgment:** `{ ok: true, data: { message: MessageDto } }`

### 4. `message:delete-permanent`
Hard-deletes a message permanently from the database.
- **Permission:** Owner only.
- **Rate Limit:** 30 / 10s (`message` group).
- **Payload:** `{ "id": "<messageId>" }`
- **Acknowledgment:** `{ ok: true, data: null }`

### 5. `reaction:add` & `reaction:remove`
Adds or removes an emoji reaction idempotently.
- **Permission:** Owner or conversation participant.
- **Rate Limit:** 30 / 10s (`message` group).
- **Payload:** `{ "id": "<messageId>", "emoji": "❤️" }`
- **Acknowledgment:** `{ ok: true, data: { message: MessageDto } }`

### 6. `conversation:read`
Advances the high-water read marker up to `messageId` and resets `unreadCount`.
- **Permission:** Owner or conversation participant.
- **Rate Limit:** 60 / 10s (`read` group).
- **Payload:** `{ "conversationId": "<conversationId>", "messageId": "<messageId>" }`
- **Acknowledgment:** `{ ok: true, data: { conversation: ConversationDto } }`

### 7. `conversation:clear`
Permanently purges all messages inside a conversation.
- **Permission:** Owner only.
- **Rate Limit:** 20 / 10s (`other` group).
- **Payload:** `{ "conversationId": "<conversationId>" }`
- **Acknowledgment:** `{ ok: true, data: null }`

### 8. `typing`
Transmits ephemeral typing indicators without persisting in the database.
- **Permission:** Owner or conversation participant.
- **Rate Limit:** 40 / 10s (silent drop on excess).
- **Payload:** `{ "conversationId": "<conversationId>", "isTyping": true }`
- **Acknowledgment:** `{ ok: true, data: null }`

### 9. `app:visibility`
Reports browser tab visibility and active conversation to suppress redundant Web Push notifications.
- **Permission:** Any authenticated socket.
- **Rate Limit:** 20 / 10s (`other` group).
- **Payload:** `{ "visible": true, "conversationId": "<conversationId>" }`
- **Acknowledgment:** `{ ok: true, data: null }`

---

## 📥 Server-to-Client Broadcast Events (Subscribe)

| Event | Destination Room | Description |
| :--- | :--- | :--- |
| **`message:new`** | Recipient user room & Owner room | Emitted when a new message is successfully committed. Role-specifically serialized (`toBoth`). |
| **`message:updated`** | Recipient user room & Owner room | Emitted on message edit, soft-delete, or reaction toggle. |
| **`message:deleted`** | Recipient user room & Owner room | Emitted when a message is permanently hard-deleted (`{ id, conversationId }`). |
| **`conversation:updated`** | Recipient user room & Owner room | Emitted when conversation metadata (last message, receipts, unread count, pin state) changes. |
| **`conversation:cleared`** | Recipient user room & Owner room | Emitted when all messages in a conversation are deleted (`{ conversationId }`). |
| **`typing`** | Target peer room only | Forwarded real-time typing indicator (`{ conversationId, isTyping }`). |
| **`presence:updated`** | Owner room only | Emitted when an ordinary user connects or disconnects (`{ userId, online, lastSeenAt }`). |
| **`presence:snapshot`** | Connecting Owner socket only | Emitted immediately upon Owner connection with array of all currently online user IDs. |
| **`user:updated`** | Owner room & `user:<userId>` room (regular user); all connected sockets (Owner) | Emitted when a user or the Owner sets or removes an avatar (`{ id, avatarUrl }`; `avatarUrl` is `null` when removed). |
