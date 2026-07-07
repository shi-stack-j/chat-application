# Frontend Implementation Specification — chat-bakend

> **Framework-agnostic specification.**
> Suitable for React, Vue, Angular, or any other frontend framework.
> All request/response schemas are exact matches to the backend implementation.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Quick Start / Connectivity](#2-quick-start--connectivity)
3. [Authentication Flow](#3-authentication-flow)
4. [REST API Reference](#4-rest-api-reference)
5. [WebSocket / STOMP Protocol](#5-websocket--stomp-protocol)
6. [State Management Model](#6-state-management-model)
7. [Component Architecture](#7-component-architecture)
8. [Real-Time Event Handling](#8-real-time-event-handling)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Data Types Reference](#10-data-types-reference)
11. [Known Backend Bugs & Workarounds](#11-known-backend-bugs--workarounds)
12. [UI/UX Requirements](#12-uiux-requirements)

---

## 1. Overview

### What This Backend Provides

The backend is a **real-time one-to-one chat server** with:

- User registration and login (custom token auth)
- Real-time messaging via WebSocket STOMP
- Delivery tracking (SENT → DELIVERED → READ)
- Conversation management (auto-create, list, summarize with unread counts)
- Online presence (real-time via in-memory cache, last seen via DB)

### What the Backend Does NOT Provide

The frontend must handle these without backend support:

| Missing Feature | Frontend Workaround |
|---|---|
| Typing indicators | Client-side only or no-op |
| Message editing/deletion | Not possible — no API |
| User search/discovery | No search endpoint — frontend needs user list from another source |
| Group chats | Only 1-to-1 conversations |
| File/image attachments | Not supported — text only |
| Push notifications | Not integrated |
| Refresh tokens | One-time-use only — re-login required on reconnect |

---

## 2. Quick Start / Connectivity

### Base URL

```
http://localhost:{port}/chat-app/v1
```

### WebSocket Endpoint

```
ws://localhost:{port}/chat-app/v1/ws
```

With SockJS fallback:
```
http://localhost:{port}/chat-app/v1/ws
```

### CORS Configuration

Backend only allows: `http://localhost:5173`

If using a different origin (e.g., production domain, different port), update `CorsConfig.java` and `WebSocketConfig.java` on the backend.

### Database Initialization

Backend uses `spring.jpa.hibernate.ddl-auto=update`, so tables are auto-created.

---

## 3. Authentication Flow

The authentication flow is **sequential and stateful**. Each step depends on the previous.

### Step 1: Register

```
POST /auth/register
Content-Type: application/json

{
    "userId": "alice",           // string, min 3 chars, REQUIRED — becomes the permanent user identifier
    "password": "Alice@123",     // string, 8-20 chars, REQUIRED — must contain uppercase, lowercase, digit, special char
    "avatarUrl": "https://...",  // string, OPTIONAL
    "nickName": "Alice Johnson"  // string, REQUIRED — display name
}
```

**Success Response:** `201 Created`
```
User Created Successfully
```

**Error Response:** `400 Bad Request`
```
Provide valid Details
```

### Step 2: Login

```
POST /auth/login
Content-Type: application/json

{
    "userId": "alice",
    "password": "Alice@123"
}
```

**Success Response:** `200 OK`
```json
{
    "userId": "alice",
    "nickName": "Alice Johnson",
    "avatarUrl": "https://...",
    "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Important:** The `token` field is a **one-time UUID**. It will be deleted from the server after use.

**Error Responses:**
- `404 Not Found`: `"User not found"` — user doesn't exist, or is inactive/deleted
- `500 Internal Server Error`: User is already logged in (token creation fails)

### Step 3: Connect WebSocket (using token)

Immediately after login, before the token expires or is used:

1. Initiate STOMP connection to `/ws`
2. Pass `token` as a STOMP header (see [WebSocket Section](#5-websocket--stomp-protocol))
3. On success: token is consumed, user is marked online, pending messages are marked delivered
4. On failure (e.g., user already online): disconnect, user must re-login

### Step 4: HTTP API Calls (no auth)

All subsequent HTTP API calls require **no authentication token**. Instead, pass the user's `userId` as a request header:

```
X-Sender-Id: alice
X-UserId: alice
X-User-Id: alice
```

Which header to use depends on the endpoint (see [REST API Reference](#4-rest-api-reference)).

### Security Note

There is **no server-side validation** that the `X-Sender-Id` or `X-UserId` header matches the WebSocket-authenticated user. Any client can impersonate any user via HTTP. The frontend should enforce its own checks.

---

## 4. REST API Reference

### 4.1 Health Check

```
GET /auth/health
```

**Response:** `200 OK`
```
Server is running
```

### 4.2 Get User Profile

```
GET /user/get/{userId}
```

**Headers:** None required

**Path Parameters:**
| Name | Type | Constraints |
|---|---|---|
| `userId` | string | min 3 chars |

**Success Response:** `200 OK`
```json
{
    "userId": "alice",
    "nickName": "Alice Johnson",
    "avatarUrl": "https://...",
    "online": true
}
```

| Field | Type | Always Present | Notes |
|---|---|---|---|
| `userId` | string | Yes | — |
| `nickName` | string | Yes | — |
| `avatarUrl` | string | Yes | Empty string `""` if not set |
| `online` | boolean | Yes | `true` if user has an active WebSocket connection |

**Error Response:** `404 Not Found`
```
User Not found with the given id
```

### 4.3 Get or Create Conversation

```
POST /conversation/create
Content-Type: application/json
X-Sender-Id: alice
```

**Headers:**
| Name | Value | Notes |
|---|---|---|
| `X-Sender-Id` | `alice` | The current user's userId |

**Request Body:**
```json
{
    "receiverId": "bob"
}
```

**⚠️ KNOWN BUG:** `conversationId` in the response is **always null**. See [BUG-1](#bug-1-conversationmapper-returns-null-conversationid).

**Intended Response (if not buggy):** `200 OK`
```json
{
    "conversationId": null,
    "user_one": "alice",
    "user_two": "bob",
    "lastMessage": "2026-06-21T10:30:00"
}
```

**Workaround:** After creating a conversation, call `GET /conversation/get/conversationSummary` to get the actual `conversationId` (the summary endpoint works correctly). Or wait for the backend bug to be fixed.

### 4.4 Get User Conversations (Raw)

```
GET /conversation/get?page=0&size=20&sort=lastMessageAt,desc
X-Sender-Id: alice
```

**Headers:**
| Name | Value |
|---|---|
| `X-Sender-Id` | `alice` |

**Query Parameters:**
| Name | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 0 | Zero-indexed |
| `size` | integer | 20 | Items per page |
| `sort` | string | `lastMessageAt,desc` | Sorting |

**Success Response:** `200 OK` — Spring Data `Page<ConversationEn>`
```json
{
    "content": [
        {
            "id": 1,
            "userOne": {
                "id": 1,
                "userId": "alice",
                "nickName": "Alice Johnson",
                "avatarUrl": "https://...",
                "password": "***",
                "active": true,
                "deleted": false,
                "createdAt": "2026-06-20T10:00:00",
                "updatedAt": "2026-06-21T10:30:00",
                "deactivatedOn": null,
                "deletedOn": null
            },
            "userTwo": { /* same structure */ },
            "createdAt": "2026-06-20T10:00:00",
            "updatedAt": "2026-06-21T10:30:00",
            "active": true,
            "lastMessageAt": "2026-06-21T10:30:00"
        }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 3,
    "last": true,
    "size": 20,
    "number": 0,
    "sort": { ... },
    "first": true,
    "empty": false
}
```

**Note:** This returns raw entities with sensitive fields (`password`). It's better to use the conversationSummary endpoint instead for display purposes. Use this only if you need the raw `id`.

### 4.5 Get Conversation Summaries (Recommended)

```
GET /conversation/get/conversationSummary?page=0&size=20&sort=lastMessageAt,desc
X-User-Id: alice
```

**Headers:**
| Name | Value |
|---|---|
| `X-User-Id` | `alice` |

**Query Parameters:**
| Name | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 0 | Zero-indexed |
| `size` | integer | 20 | Items per page |
| `sort` | string | `lastMessageAt,desc` | Sorting |

**Success Response:** `200 OK` — Spring Data `Page<ConversationSummaryResDto>`
```json
{
    "content": [
        {
            "conversationId": 1,
            "receiver": {
                "userId": "bob",
                "nickName": "Bob Smith",
                "avatarUrl": "https://...",
                "online": true
            },
            "lastMessage": "Hey, how are you?",
            "lastMessageTime": "2026-06-21T10:30:00",
            "unreadCount": 3
        }
    ],
    "totalPages": 1,
    "totalElements": 3,
    "number": 0,
    "size": 20,
    "first": true,
    "last": true,
    "empty": false
}
```

| Field | Type | Always Present | Notes |
|---|---|---|---|
| `conversationId` | number | Yes | Use this as the conversation identifier |
| `receiver` | `UserResDto` | Yes | The **other** participant in the conversation |
| `receiver.userId` | string | Yes | — |
| `receiver.nickName` | string | Yes | — |
| `receiver.avatarUrl` | string | Yes | Empty string if not set |
| `receiver.online` | boolean | Yes | Real-time online status |
| `lastMessage` | string | Yes | Empty string `""` if no messages |
| `lastMessageTime` | string (ISO-8601) | Yes | Timestamp of last message or conversation creation |
| `unreadCount` | number | Yes | Count of messages with status ≠ `READ` |

**This is the primary endpoint for the conversation list screen.**

### 4.6 Get Total Unread Count

```
GET /messages/get/unreadCounts
X-UserId: alice
```

**Headers:**
| Name | Value |
|---|---|
| `X-UserId` | `alice` |

**Success Response:** `200 OK`
```
42
```

Returns a raw number (not JSON). Parse as integer.

### 4.7 Mark Messages as Read

```
POST /messages/mark/read
Content-Type: application/json
X-UserId: alice
```

**Headers:**
| Name | Value |
|---|---|
| `X-UserId` | `alice` |

**Request Body:**
```json
{
    "conversationId": 1
}
```

**Success Response:** `200 OK`
```
[ 5 ] Messages mark as read
```

Returns a string like `"[ N ] Messages mark as read"` where `N` is the count of messages updated.

**Important backend behavior:**
- Only messages with `status = 'DELIVERED'` are marked as `READ`.
- Messages with `status = 'SENT'` are NOT affected.
- If the receiver's WebSocket was not connected when messages were sent, the `DELIVERED` step was skipped, and these messages won't be marked as READ until the receiver connects and the backend calls `markAsDelivered()`.

### 4.8 Get Latest Messages (BROKEN)

**⚠️ BUG: Do NOT use this endpoint. See [BUG-4](#bug-4-get-latestmessages-uses-get-with-a-request-body).**

```
GET /messages/get/latestMessages
Content-Type: application/json  ← BUG: body on GET
{
    "conversationId": 1
}
```

**Workaround:** There is no working endpoint to fetch messages for a conversation. The frontend must rely on:
- Messages received via WebSocket (real-time)
- After WebSocket reconnection, waiting for new messages

If you need message history, you must implement a new backend endpoint or fix the existing one.

---

## 5. WebSocket / STOMP Protocol

### 5.1 Connection

```
STOMP CONNECT
Endpoint: /ws
Host: localhost:{port}

STOMP Headers:
    token: <one-time UUID from login>
```

**Important:** The `token` header is a **STOMP native header**. In most STOMP client libraries, this is passed as a separate header parameter during connection, not inside the body.

**Example — using `@stomp/stompjs` (JavaScript):**

```javascript
const client = new StompJs.Client({
    brokerURL: 'ws://localhost:8080/chat-app/v1/ws',
    connectHeaders: {
        token: loginResponse.token
    },
    // For SockJS fallback:
    // webSocketFactory: () => new SockJS('http://localhost:8080/chat-app/v1/ws')
});
```

**Connection success:** The server automatically:
1. Validates token
2. Marks user as online
3. Marks all `SENT` messages as `DELIVERED`
4. Deletes the token (cannot be reused)

**Connection failure:** The server throws a `RuntimeException`:
- `"Temporary token not found"` — token is invalid or already used
- `"Not allowed user Already present"` — user is already connected from another session
- `"User id information is not valid"` — various validation failures

### 5.2 Subscribing to Messages

After connection, subscribe to receive incoming messages:

```
SUBSCRIBE
Destination: /queue/messages/{yourUserId}
```

**Example subscription path:** `/queue/messages/alice`

**Received message body (`MessageResDto`):**
```json
{
    "content": "Hey, how are you?",
    "senderId": "bob",
    "receivedAt": "2026-06-21T10:30:00.123456"
}
```

| Field | Type | Always Present | Notes |
|---|---|---|---|
| `content` | string | Yes | The message text |
| `senderId` | string | Yes | The userId of the sender |
| `receivedAt` | string (ISO-8601) | Yes | Timestamp when the server processed the message |

### 5.3 Sending Messages

```
SEND
Destination: /app/chat
Body:
```

```json
{
    "receiver": "bob",
    "content": "Hey, how are you?",
    "sendAt": "2026-06-21T10:30:00"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `receiver` | string | Yes | Min 3 chars, must be the receiver's `userId` |
| `content` | string | No | Message text (no size limit on backend) |
| `sendAt` | ISO-8601 datetime | No | Can be omitted or set to current time by frontend |

**No acknowledgment:** The backend does NOT acknowledge receipt of the sent message via WebSocket. The sender does not receive the message back. If the frontend needs to show the sent message in the UI, it must optimistically add it to the local message list.

### 5.4 Disconnection

When the user disconnects (closes tab, navigates away, loses network):

```
STOMP DISCONNECT
```

The backend:
1. Detects the session disconnect via `SessionDisconnectEvent`
2. Removes user from the in-memory online list
3. **Does NOT** update `lastSeenAt` in the database

### 5.5 Reconnection Strategy

Because the token is one-time use:

| Scenario | Action |
|---|---|
| Token expired (not used within reasonable time) | Re-login required |
| WebSocket dropped, user still wants to chat | Re-login and reconnect |
| User already online (2nd tab) | Connection rejected — only one session allowed |

**Recommended reconnection flow:**
1. Detect WebSocket disconnect
2. Attempt reconnection with same token (will fail — token already consumed)
3. Call `POST /auth/login` again to get a new token
4. Connect WebSocket with new token
5. Re-subscribe to `/queue/messages/{userId}`
6. Refresh conversation list and unread counts via HTTP

### 5.6 Full Connection Lifecycle Diagram

```
User opens app
    ↓
Check for saved token? (In memory only — no persistent storage)
    ↓ no
Show Login screen
    ↓
POST /auth/login → get { userId, nickName, avatarUrl, token }
    ↓
Store in memory: { userId, token }
    ↓
STOMP CONNECT /ws (header: token=xxx)
    ├── Success →
    │   ├── Subscribe to /queue/messages/{userId}
    │   ├── Load conversations (GET /conversation/get/conversationSummary)
    │   ├── Load unread count (GET /messages/get/unreadCounts)
    │   └── Enter Chat screen
    │
    └── Failure →
        ├── "User already present" → Show error: already logged in elsewhere
        └── "Token not found" → Show error: session expired, re-login
```

---

## 6. State Management Model

### 6.1 Core State Shape

```typescript
interface AppState {
    // Authentication
    auth: {
        userId: string | null;
        nickName: string | null;
        avatarUrl: string | null;
        token: string | null;
        isConnected: boolean;
    };

    // WebSocket
    ws: {
        client: any | null;      // STOMP client instance
        status: 'disconnected' | 'connecting' | 'connected' | 'error';
    };

    // Conversations
    conversations: {
        items: ConversationSummary[];
        totalUnread: number;
        pagination: {
            page: number;
            size: number;
            totalPages: number;
            totalElements: number;
        };
        isLoading: boolean;
        error: string | null;
    };

    // Active Chat
    activeChat: {
        conversationId: number | null;
        receiver: UserProfile | null;
        messages: Message[];
    };
}

interface ConversationSummary {
    conversationId: number;
    receiver: UserProfile;
    lastMessage: string;
    lastMessageTime: string;    // ISO-8601
    unreadCount: number;
}

interface UserProfile {
    userId: string;
    nickName: string;
    avatarUrl: string;
    online: boolean;
}

interface Message {
    content: string;
    senderId: string;
    receivedAt: string;         // ISO-8601 (server timestamp)
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    isOutgoing: boolean;        // Determined by client: senderId === auth.userId
}
```

### 6.2 Message Status Lifecycle

```
[Client sends] → status: 'sending' (optimistic local)
    ↓
[Server processes] → client receives nothing back
    ↓ (client should mark as 'sent' after a timeout or heuristic)
[Receiver connects] → server calls markAsDelivered() → status becomes 'delivered'
    ↓
[Receiver calls POST /messages/mark/read] → status becomes 'read'
```

**Frontend implications:**
- The **sender** never receives delivery/read updates via WebSocket. There is no "message delivered" or "message read" event pushed to the sender.
- The sender can only know delivery status by polling `GET /messages/get/unreadCounts` or checking if the conversation summary changes.
- The **receiver** gets the message via WebSocket immediately.

### 6.3 State Updates from Events

| Event | Action |
|---|---|
| WebSocket message received | Add message to `activeChat.messages` if conversation matches |
| WebSocket message received for different conversation | Increment `unreadCount` in `conversations.items` for that conversation |
| `POST /messages/mark/read` success | Update `unreadCount` to 0 for that conversation in local state |
| WebSocket connected | Refresh conversation summaries and total unread count |
| User logs out | Clear all state |

---

## 7. Component Architecture

### 7.1 Screen Hierarchy

```
App
├── AuthScreen (shown when not authenticated)
│   ├── LoginForm
│   │   ├── userId input
│   │   ├── password input
│   │   └── submit button
│   └── RegisterForm
│       ├── userId input
│       ├── password input
│       ├── nickName input
│       ├── avatarUrl input (optional)
│       └── submit button
│
└── ChatScreen (shown when authenticated + connected)
    ├── Sidebar
    │   ├── UserProfileHeader (current user info + status)
    │   ├── SearchBar (if needed — no backend support for search)
    │   └── ConversationList
    │       ├── ConversationListItem (repeated)
    │       │   ├── Avatar + online indicator
    │       │   ├── receiver nickName
    │       │   ├── lastMessage preview
    │       │   ├── lastMessageTime
    │       │   └── unreadCount badge
    │       └── LoadMore (infinite scroll / pagination button)
    │
    └── ChatArea (shown when a conversation is selected)
        ├── ChatHeader
        │   ├── receiver Avatar + nickName
        │   ├── online/offline indicator
        │   └── back button (mobile)
        ├── MessageList
        │   ├── MessageBubble (repeated)
        │   │   ├── content text
        │   │   ├── timestamp
        │   │   └── status indicator (sending/sent/delivered/read)
        │   └── EmptyState (when no messages)
        └── MessageInput
            ├── text input
            └── send button
```

### 7.2 Component Responsibilities

| Component | Responsibility | Data Source |
|---|---|---|
| `LoginForm` | Handle userId/password input, call `/auth/login` | REST API |
| `RegisterForm` | Handle registration fields, call `/auth/register` | REST API |
| `ConversationList` | Fetch and display paginated conversation summaries | REST: `GET /conversationSummary` |
| `ConversationListItem` | Display conversation preview, handle click → open chat | Local state from list |
| `MessageList` | Display messages for active conversation | Local state (from WebSocket + optimistic) |
| `MessageBubble` | Render message with sender distinction, status icon | Local state |
| `MessageInput` | Validate input, send via WebSocket, update local state | WebSocket SEND |
| `ChatHeader` | Display receiver info with online status | REST: `GET /user/get/{id}` (on open) |

---

## 8. Real-Time Event Handling

### 8.1 Events the Frontend Must Handle

| Event | Source | Action |
|---|---|---|
| `Incoming message` | WebSocket `/queue/messages/{userId}` | Add to message list; update conversation lastMessage + time |
| `WebSocket connected` | STOMP `CONNECTED` frame | Refresh conversations + unread count |
| `WebSocket disconnected` | STOMP `DISCONNECT` / error | Show reconnection UI; attempt re-login |
| `User regains focus` | Browser `visibilitychange` | Refresh conversations + unread count (optional) |

### 8.2 Event: Incoming Message

When a message arrives via WebSocket:

```json
{
    "content": "Hello!",
    "senderId": "bob",
    "receivedAt": "2026-06-21T10:30:00.123456"
}
```

Frontend should:

1. If `activeChat.conversationId` matches the conversation with `senderId`:
   - Append message to `activeChat.messages`
   - Mark message as `isOutgoing: false`
2. If `activeChat.conversationId` is different or no chat is open:
   - Find the conversation in `conversations.items` where `receiver.userId === senderId`
   - Update `lastMessage` and `lastMessageTime`
   - Increment `unreadCount` by 1
   - Increment `totalUnread` by 1

**Since backend doesn't include `conversationId` in the WebSocket message**, the frontend must:
- Maintain a local mapping: `receiverUserId ↔ conversationId` (from conversation summaries)
- Look up the conversation by matching `senderId` with the `receiver.userId` field in summaries

### 8.3 Event: WebSocket Reconnection

When reconnecting (after disconnect):

1. Call `POST /auth/login` to get a new token
2. Connect WebSocket with new token
3. Re-subscribe to `/queue/messages/{userId}`
4. Refresh `GET /conversation/get/conversationSummary`
5. Refresh `GET /messages/get/unreadCounts`
6. If a conversation was open, reload messages (not possible via API — use local cache)

---

## 9. Error Handling Strategy

### 9.1 HTTP Error Handling

| HTTP Status | Meaning | Frontend Action |
|---|---|---|
| `400` | Validation error / bad request | Show validation error message to user |
| `404` | Resource not found | Show "Not found" message; redirect if login failed |
| `500` | Server error (RuntimeException) | Show "Something went wrong"; log the error |

The backend returns errors as plain strings (not JSON). For example:
```
Provide valid Details
User Not found with the given id
```

### 9.2 WebSocket Error Handling

| Error | Cause | Frontend Action |
|---|---|---|
| Connection rejected | Invalid/used token | Show "Session expired, please login again" |
| Connection rejected | Already logged in elsewhere | Show "Already logged in on another device" |
| Connection dropped | Network issue | Show reconnection UI; attempt auto-reconnect |
| Send failure | Not connected | Queue message locally; send after reconnect |

### 9.3 Optimistic Updates & Rollback

For sending messages:

```typescript
function sendMessage(content: string, receiverId: string) {
    // 1. Optimistically add to local state
    const tempMessage = {
        content,
        senderId: auth.userId,
        receivedAt: new Date().toISOString(),
        status: 'sending',
        isOutgoing: true
    };
    addToMessageList(tempMessage);

    // 2. Send via WebSocket
    try {
        stompClient.publish({
            destination: '/app/chat',
            body: JSON.stringify({
                receiver: receiverId,
                content,
                sendAt: new Date().toISOString()
            })
        });
        // 3. Mark as sent after a short delay (no acknowledgment from server)
        setTimeout(() => {
            updateMessageStatus(tempMessage, 'sent');
        }, 500);
    } catch (error) {
        // 4. Rollback on failure
        removeFromMessageList(tempMessage);
        showError('Failed to send message');
    }
}
```

---

## 10. Data Types Reference

### 10.1 Datetime Format

All timestamps use ISO-8601 format without timezone offset (server local time):

```
2026-06-21T10:30:00.123456
2026-06-21T10:30:00
```

The backend uses `LocalDateTime` which does not carry timezone information. Assume the server is in its configured timezone.

### 10.2 User ID Constraints

| Constraint | Value |
|---|---|
| Minimum length | 3 characters |
| Case sensitivity | Case-sensitive (backend uses `.compareTo()` for sorting) |
| Uniqueness | Unique in database |

### 10.3 Password Constraints

| Constraint | Value |
|---|---|
| Minimum length | 8 characters |
| Maximum length | 20 characters |
| Must contain | At least 1 uppercase letter |
| Must contain | At least 1 lowercase letter |
| Must contain | At least 1 digit |
| Must contain | At least 1 special character from `@$!%*?&` |

### 10.4 Pagination

All list endpoints use Spring Data `Pageable`:

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 0 | Zero-indexed page number |
| `size` | integer | 20 | Items per page (max not enforced) |
| `sort` | string | varies | Format: `property,direction` (e.g., `lastMessageAt,desc`) |

Response is a Spring Data `Page` object:
```json
{
    "content": [ ... ],
    "pageable": { "pageNumber": 0, "pageSize": 20, ... },
    "totalPages": 5,
    "totalElements": 100,
    "last": false,
    "first": true,
    "size": 20,
    "number": 0,
    "empty": false
}
```

---

## 11. Known Backend Bugs & Workarounds

### BUG-1: `ConversationMapper` returns null conversationId

**Impact:** `POST /conversation/create` returns `conversationId: null`.

**Workaround 1:** After creating a conversation, call `GET /conversation/get/conversationSummary` and find the conversation by matching the `receiver.userId`. The summary endpoint returns correct `conversationId`.

**Workaround 2:** Use `GET /conversation/get` (raw entities) to get the conversation `id` directly. The raw endpoint returns the correct `id`.

**Recommendation:** Use workaround 1 as the primary flow.

### BUG-2: WebSocket connection always fails (saveOnlineUser inverted logic)

**Impact:** `OnlinePresenceSer.saveOnlineUser()` always throws "User not found" when the user exists in the database. **This blocks ALL WebSocket connections.**

**Workaround:** None on frontend side. This is a backend bug in `service/OnlinePresenceSer.java:52`. The backend must fix `if(userExists)` → `if(!userExists)`.

**Testing guidance:** If WebSocket connections fail with "USer not found" (note the typo), this is the cause.

### BUG-3: `@NotBlank` on Long field in `MarkReadReqDto`

**Impact:** May cause validation failures when calling `POST /messages/mark/read`.

**Workaround:** The `@NotBlank` annotation on a `Long` is invalid but may be silently ignored. If validation errors occur, the backend must fix this.

### BUG-4: `GET /messages/get/latestMessages` uses `@RequestBody` on GET

**Impact:** Cannot fetch message history for a conversation. The endpoint is effectively unusable.

**Workaround:** There is no frontend workaround for message history. Options:
1. Use only messages received via WebSocket (real-time only, no history)
2. Request backend fix (change to `@PostMapping` or use query parameters)

**Recommended approach:** Implement a simple client-side message cache. When the WebSocket is connected, accumulate messages. If the user switches conversations and comes back, the locally cached messages can be shown. This means message history is only as old as the current WebSocket session.

### BUG-5: No `lastSeenAt` update on disconnect

**Impact:** The `OnlinePresenceEn.lastSeenAt` is never updated when a user disconnects. The "last seen" feature is non-functional.

**Frontend implication:** Do not rely on the `lastSeenAt` for display. The online status (`isOnline`) from `GET /user/get/{userId}` works in real time, but the last seen timestamp will always be null/initial value.

---

## 12. UI/UX Requirements

### 12.1 Screen States

Every screen needs to handle these states:

| State | Display |
|---|---|
| **Loading** | Spinner or skeleton UI |
| **Empty** | Appropriate empty state message |
| **Error** | Error message with retry action |
| **Success** | Normal content |

### 12.2 Login Screen

- "Register" tab/link to switch to registration form
- "Login" button → calls `/auth/login`:
  - On success → store token in memory, attempt WebSocket connection
  - On 404 → "User not found. Have you registered?"
  - On error → display server error message

### 12.3 Register Screen

- All fields with validation matching backend constraints
- Submit button → calls `/auth/register`:
  - On 201 → auto-navigate to login (or auto-login)
  - On error → display validation error

### 12.4 Conversation List

- Sort by `lastMessageTime` descending (most recent first)
- Show unread count badge on each conversation
- Infinite scroll or "Load more" for pagination
- Clicking a conversation item:
  1. Call `POST /messages/mark/read` (to mark messages as read)
  2. Set as active chat
  3. Show the ChatArea
- Show total unread count in header/badge

### 12.5 Chat Area

- Messages aligned by sender (outgoing right, incoming left)
- Show timestamp for each message (or grouped by time)
- Show message status for outgoing messages:
  - 'sending' → clock/spinner
  - 'sent' → single check
  - 'delivered' → double check (if known)
  - 'read' → blue double check (if known)
- Auto-scroll to bottom on new message
- Scroll up to see older messages (no history support — only current session)

### 12.6 Online Status

- Green dot for online users, gray for offline
- Update in real time when conversation summaries are refreshed
- Since there's no WebSocket event for status changes, the frontend should periodically refresh conversation summaries or the individual user profile

### 12.7 New Conversation Flow

The frontend needs a way to start a new conversation:
1. User enters a userId to chat with
2. Frontend calls `POST /conversation/create` with `{ receiverId }`
3. On success → open the conversation in ChatArea
4. If receiver doesn't exist → `POST /conversation/create` will fail because backend validates receiver exists in DB

Since there's **no user search endpoint**, the frontend must:
- Either hard-code or pre-load a list of users
- Or let the user type a userId and validate by calling `GET /user/get/{userId}`

### 12.8 Mobile Responsiveness

- On mobile: show conversation list or chat area, not both (split view on desktop)
- Back button in ChatHeader to return to conversation list

---

## Appendix A: Full API Surface Summary

### REST Endpoints

| Method | Path | Auth Header | Body | Response Type |
|---|---|---|---|---|
| `POST` | `/auth/register` | None | `RegisterReqDto` | Plain string |
| `POST` | `/auth/login` | None | `LogReqDto` | `LogResDto` (JSON) |
| `GET` | `/auth/health` | None | — | Plain string |
| `GET` | `/user/get/{userId}` | None | — | `UserResDto` |
| `POST` | `/conversation/create` | `X-Sender-Id` | `ConversationReqDto` | `ConversationDto` (buggy) |
| `GET` | `/conversation/get` | `X-Sender-Id` | Query params | `Page<ConversationEn>` |
| `GET` | `/conversation/get/conversationSummary` | `X-User-Id` | Query params | `Page<ConversationSummaryResDto>` |
| `GET` | `/messages/get/unreadCounts` | `X-UserId` | — | Raw Long |
| `POST` | `/messages/mark/read` | `X-UserId` | `MarkReadReqDto` | Plain string |
| `GET` | `/messages/get/latestMessages` | None | Body (buggy) | `List<MessageEn>` |

### WebSocket

| Direction | Destination | Payload | Purpose |
|---|---|---|---|
| Subscribe | `/queue/messages/{userId}` | — | Receive incoming messages |
| Send | `/app/chat` | `MessageReqDto` | Send a message |

---

## Appendix B: Client Library Suggestions

| Language/Framework | STOMP Client | Notes |
|---|---|---|
| JavaScript (React, Vue, etc.) | `@stomp/stompjs` + `sockjs-client` | Most popular combination |
| TypeScript | `@stomp/stompjs` | TypeScript support built-in |
| Flutter/Dart | `stomp_dart_client` | STOMP for Dart |
| Swift (iOS) | `StompClientLib` | For native iOS |
| Kotlin (Android) | `OkHttp` + custom STOMP | For native Android |

---

## Appendix C: Environment Variables / Configuration

The frontend should have these as configurable constants:

```typescript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/chat-app/v1',
    WS_URL: 'ws://localhost:8080/chat-app/v1/ws',
    WS_USE_SOCKJS: true,          // Set to true for SockJS fallback
    RECONNECT_DELAY_MS: 3000,    // Delay before attempting reconnect
    PAGINATION_SIZE: 20,         // Default page size for list endpoints
};
```
