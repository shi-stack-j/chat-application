# Backend Architecture Documentation — chat-bakend

> **Generated from source code analysis.**
> Do not modify this file manually — update the source code and regenerate.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Backend Architecture](#3-backend-architecture)
4. [Project Structure](#4-project-structure)
5. [Database Architecture](#5-database-architecture)
6. [API Endpoints](#6-api-endpoints)
7. [WebSocket / STOMP Protocol](#7-websocket--stomp-protocol)
8. [Security Model](#8-security-model)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Known Bugs and Limitations](#10-known-bugs-and-limitations)
11. [Design Patterns Used](#11-design-patterns-used)

---

## 1. Project Overview

### Application Purpose

A real-time chat application backend enabling:

- User registration and authentication (custom token-based)
- One-to-one private messaging via WebSocket
- Message delivery tracking (SENT → DELIVERED → READ)
- Conversation management (auto-create, list, summarize)
- Online presence tracking (in-memory real-time + persistent last seen)

### Main Features

| Feature | Implementation |
|---|---|
| Register/Login | REST endpoints, custom UUID tokens, plaintext passwords |
| Real-time messaging | WebSocket STOMP over SockJS |
| Message delivery tracking | `MessageDeliveryEn` entity with SENT/DELIVERED/READ states |
| Read receipts | Mark messages as read by conversation |
| Unread counts | Per-user total and per-conversation unread message counts |
| Conversation management | Auto-create on first message, list with pagination, summary with last message |
| Online presence | In-memory `ConcurrentHashMap` for real-time, JPA entity for last seen persistence |
| Pagination | Spring Data `Pageable` for all list endpoints |

---

## 2. Technology Stack

| Component | Technology | Version |
|---|---|---|
| Language | Java | 21 |
| Framework | Spring Boot | 4.0.6 |
| Database | MySQL | via `mysql-connector-j` (runtime) |
| ORM | Spring Data JPA / Hibernate | — |
| Messaging | Spring WebSocket + STOMP | — |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) | — |
| Utilities | Lombok | — |
| Build | Maven | — |

### Dependencies (`pom.xml`)

```xml
spring-boot-starter-data-jpa
spring-boot-starter-validation
spring-boot-starter-webmvc
spring-boot-starter-websocket
mysql-connector-j       (runtime)
lombok                  (optional)
```

---

## 3. Backend Architecture

### Layered Architecture

```
                         ┌──────────────────────────┐
                         │      HTTP / WebSocket     │
                         │       (Client Apps)       │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │          Controller Layer           │
                    │  (REST: AuthCon, ConversationCon,   │
                    │   MessageCon, UserCon               │
                    │   STOMP: ChatCon)                   │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │           Service Layer             │
                    │  (Business Logic, Orchestration)    │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │       Repository / Data Layer       │
                    │  (JPA Repositories + In-Memory)     │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │         MySQL Database +            │
                    │    ConcurrentHashMap (in-memory)    │
                    └────────────────────────────────────┘
```

### Request Lifecycle — REST

```
Client → HTTP Request → Controller → Service → Repository → DB
                         ↓                              ↓
                    DTO Validation                  Entity/Page
                         ↓                              ↓
                    Response Entity ← Service ← Repository
                         ↓
Client ← HTTP Response ← Controller
```

### Request Lifecycle — WebSocket (Message Send)

```
Client → STOMP /app/chat (MessageReqDto)
         → ChatCon.handleMessage()
         → ChatSer.handleMessage()
             → MessageSer.sendMessage()
                 → MessageMapper.toMessageEn()
                 → MessageDeliverySer.createDelivery()
                 → MessageDeliveryMapper.toMessageDeliveryEn() [status=SENT]
                 → MessageDeliveryRepo.save()
             → MessageMapper.toMessageResDto()
         → SimpMessagingTemplate.convertAndSend(/queue/messages/{receiverId})
```

---

## 4. Project Structure

```
src/main/java/com/shiv/chat_bakend/
│
├── ChatBakendApplication.java          # @SpringBootApplication entry point
│
├── controller/                          # HTTP + WebSocket entry points
│   ├── AuthCon.java                     # /auth/* — register, login, health
│   ├── ChatCon.java                     # @MessageMapping("/chat") — WebSocket message handler
│   ├── ConversationCon.java             # /conversation/* — create, list, summarize
│   ├── MessageCon.java                  # /messages/* — unread counts, mark read, get messages
│   └── UserCon.java                     # /user/* — get user profile
│
├── service/                             # Business logic layer
│   ├── AuthSer.java                     # Register & login logic, token creation
│   ├── ChatSer.java                     # WebSocket message routing via SimpMessagingTemplate
│   ├── ConversationSer.java             # Conversation CRUD, summary generation
│   ├── MessageSer.java                  # Message persistence + coordination with delivery
│   ├── MessageDeliverySer.java          # Delivery status management (create, mark read/delivered)
│   ├── OnlinePresenceSer.java           # Online/offline state + last seen persistence
│   ├── TokenSer.java                    # Token generation, validation, lifecycle
│   ├── UserSer.java                     # User profile retrieval
│   └── WebSocketEventListeners.java     # Session connect/disconnect lifecycle handlers
│
├── repository/                          # Data access layer
│   ├── ConversationRepo.java            # JPA — conversation queries
│   ├── MessageDeliveryRepo.java         # JPA + @Modifying for delivery status updates
│   ├── MessageRepo.java                 # JPA — message queries by conversation
│   ├── OnlinePresenceRepo.java          # JPA — last seen persistence
│   ├── OnlineRepo.java                  # In-memory ConcurrentHashMap — real-time online users
│   ├── TokenRepo.java                   # In-memory ConcurrentHashMap — temporary tokens
│   └── UserRep.java                     # JPA — user queries
│
├── model/                               # JPA entities + POJOs
│   ├── UserEn.java                      # User entity (JPA)
│   ├── ConversationEn.java              # Conversation entity (JPA)
│   ├── MessageEn.java                   # Message entity (JPA)
│   ├── MessageDeliveryEn.java           # Message delivery tracking entity (JPA)
│   ├── OnlinePresenceEn.java            # Online presence / last seen entity (JPA)
│   ├── ChatMessage.java                 # Plain POJO (legacy/unused)
│   └── UserMod.java                     # Plain POJO (legacy/unused)
│
├── dto/                                 # Data Transfer Objects
│   ├── auth/
│   │   ├── RegisterReqDto.java          # Registration request
│   │   ├── LogReqDto.java               # Login request
│   │   └── LogResDto.java               # Login response (userId, nickName, avatarUrl, token)
│   ├── conversation/
│   │   ├── ConversationReqDto.java      # Get/create conversation request
│   │   ├── ConversationDto.java         # Conversation response (basic)
│   │   └── ConversationSummaryResDto.java  # Conversation list item (with last message, unread count)
│   ├── message/
│   │   ├── MessageReqDto.java           # Send message request (WebSocket)
│   │   ├── MessageResDto.java           # Message response (WebSocket push)
│   │   ├── MessageReadReqDto.java       # Get messages request (conversationId)
│   │   └── MarkReadReqDto.java          # Mark messages as read request
│   └── user/
│       ├── UserResDto.java              # User profile response
│       └── OnlinePresenceResDto.java    # Online presence / last seen response
│
├── mapper/                              # Entity ↔ DTO conversion utilities
│   ├── LoginMapper.java                 # RegisterReqDto ↔ UserEn, UserEn → LogResDto
│   ├── MessageMapper.java               # MessageReqDto → MessageEn, MessageEn → MessageResDto
│   ├── MessageDeliveryMapper.java       # MessageEn → MessageDeliveryEn
│   ├── ConversationMapper.java          # ConversationEn ↔ ConversationDto, summary
│   ├── UserMapper.java                  # UserEn → UserResDto
│   └── OnlinePresenceMapper.java        # OnlinePresenceEn → OnlinePresenceResDto
│
├── configuration/                       # Application configuration
│   ├── CorsConfig.java                  # CORS for http://localhost:5173
│   └── WebSocketConfig.java             # STOMP endpoint + broker configuration
│
└── enums/
    └── MessageStatusEnum.java           # SENT, DELIVERED, READ

src/main/resources/
└── application.properties               # DB config, context path, JPA settings
```

---

## 5. Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    UserEn ||--o{ ConversationEn : "userOne"
    UserEn ||--o{ ConversationEn : "userTwo"
    UserEn ||--o{ MessageEn : "sender"
    UserEn ||--o{ MessageEn : "receiver"
    UserEn ||--o{ MessageDeliveryEn : "delivery target"
    UserEn ||--o| OnlinePresenceEn : "presence"
    ConversationEn ||--o{ MessageEn : "contains"
    MessageEn ||--o{ MessageDeliveryEn : "delivery records"

    UserEn {
        Long id PK "auto-increment"
        string userId UK "min 3 chars, unique"
        string nickName "not null"
        string password "not null, min 8, mixed case+digit+special"
        string avatarUrl "nullable"
        boolean isActive "default true"
        boolean deleted "default false"
        datetime createdAt "auto"
        datetime updatedAt "auto"
        datetime deactivatedOn "nullable"
        datetime deletedOn "nullable"
    }

    ConversationEn {
        Long id PK "auto-increment"
        Long user_one_id FK "not null"
        Long user_two_id FK "not null"
        datetime createdAt "auto"
        datetime updatedAt "auto"
        boolean active "default true"
        datetime lastMessageAt "nullable"
    }

    MessageEn {
        Long id PK "auto-increment"
        Long conversation_id FK "not null"
        Long sender_id FK "not null"
        Long receiver_id FK "not null"
        text content "not null"
        datetime sentAt "auto"
        datetime createdAt "auto"
    }

    MessageDeliveryEn {
        Long id PK "auto-increment"
        Long message_id FK "not null"
        Long user_id FK "not null"
        string status "SENT|DELIVERED|READ"
        datetime deliveredAt "nullable"
        datetime readAt "nullable"
    }

    OnlinePresenceEn {
        Long id PK "auto-increment"
        Long user_id FK UK "not null, unique"
        datetime lastSeenAt "nullable"
    }
```

### Entity Details

#### UserEn (`user_en` table)

| Field | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` | auto | Primary key |
| `userId` | `String` | `@Column(nullable=false, unique=true)`, `@Size(min=3)` | — | Business key, unique identifier |
| `nickName` | `String` | `@Column(nullable=false)` | — | Display name |
| `password` | `String` | `@Column(nullable=false)`, `@Size(min=8, max=20)`, `@Pattern(regexp=^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$)` | — | Plaintext (no hashing) |
| `avatarUrl` | `String` | — | `null` | Optional avatar |
| `isActive` | `boolean` | — | `true` | Soft active flag |
| `deleted` | `boolean` | — | `false` | Soft delete flag |
| `createdAt` | `LocalDateTime` | `@CreationTimestamp` | auto | — |
| `updatedAt` | `LocalDateTime` | `@UpdateTimestamp` | auto | — |
| `deactivatedOn` | `LocalDateTime` | — | `null` | When deactivated |
| `deletedOn` | `LocalDateTime` | — | `null` | When soft-deleted |

**Relationships:**
- `ConversationEn.userOne` → `@OneToMany` (inverse side, mapped by `ConversationEn.userOne`)
- `ConversationEn.userTwo` → `@OneToMany` (inverse side, mapped by `ConversationEn.userTwo`)
- `MessageEn.sender` → `@OneToMany` (inverse side)
- `MessageEn.receiver` → `@OneToMany` (inverse side)
- `OnlinePresenceEn.user` → `@OneToOne`

#### ConversationEn (`conversation_en` table)

| Field | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` | auto | Primary key |
| `userOne` | `UserEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="user_one_id", nullable=false)` | — | FK to user_en |
| `userTwo` | `UserEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="user_two_id", nullable=false)` | — | FK to user_en |
| `createdAt` | `LocalDateTime` | `@CreationTimestamp` | auto | — |
| `updatedAt` | `LocalDateTime` | `@UpdateTimestamp` | auto | — |
| `active` | `boolean` | — | `true` | Active flag |
| `lastMessageAt` | `LocalDateTime` | — | `null` | Timestamp of last message |

**Constraints:**
- `@UniqueConstraint(columnNames = {"user_one_id", "user_two_id"})` — ensures one conversation per user pair
- `@Index(name="idx_conversation_users", columnList="user_one_id,user_two_id")` — composite index

**Relationships:**
- `userOne` → `@ManyToOne` → `UserEn` (LAZY)
- `userTwo` → `@ManyToOne` → `UserEn` (LAZY)
- `MessageEn.conversation` → `@OneToMany` (inverse side)

**Note:** `userOne` and `userTwo` are sorted alphabetically by `userId` during creation to ensure consistent ordering. The `compareTo` method of `String` is used to determine which user is userOne and which is userTwo.

#### MessageEn (`messages` table)

| Field | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` | auto | Primary key |
| `conversation` | `ConversationEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="conversation_id", nullable=false)` | — | FK to conversation_en |
| `sender` | `UserEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="sender_id", nullable=false)` | — | FK to user_en |
| `receiver` | `UserEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="receiver_id", nullable=false)` | — | FK to user_en |
| `content` | `String` | `@Column(nullable=false, columnDefinition="TEXT")` | — | Message body |
| `sentAt` | `LocalDateTime` | `@CreationTimestamp` | auto | Redundant with `createdAt` |
| `createdAt` | `LocalDateTime` | `@CreationTimestamp` | auto | Redundant with `sentAt` |

**Indexes:**
- `idx_message_conversation` on `conversation_id`
- `idx_message_created` on `created_at`

**Relationships:**
- `conversation` → `@ManyToOne` → `ConversationEn` (LAZY)
- `sender` → `@ManyToOne` → `UserEn` (LAZY)
- `receiver` → `@ManyToOne` → `UserEn` (LAZY)
- `MessageDeliveryEn.message` → `@OneToMany` (inverse side)

#### MessageDeliveryEn (`message_delivery` table)

| Field | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` | auto | Primary key |
| `message` | `MessageEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="message_id", nullable=false)` | — | FK to messages |
| `user` | `UserEn` | `@ManyToOne(fetch=LAZY)`, `@JoinColumn(name="user_id", nullable=false)` | — | FK to user_en (the receiver) |
| `status` | `MessageStatusEnum` | `@Enumerated(STRING)` | — | SENT, DELIVERED, or READ |
| `deliveredAt` | `LocalDateTime` | — | `null` | Set when DELIVERED |
| `readAt` | `LocalDateTime` | — | `null` | Set when READ |

**Indexes:**
- `idx_delivery_message` on `message_id`
- `idx_delivery_user` on `user_id`

**Relationships:**
- `message` → `@ManyToOne` → `MessageEn` (LAZY)
- `user` → `@ManyToOne` → `UserEn` (LAZY)

**Status Transitions:**

```
SENT ──(delivered)──▶ DELIVERED ──(read)──▶ READ
```

**Bulk Update Queries (in `MessageDeliveryRepo`):**

1. `markPendingMessagesDelivered(userId)`: Updates `status='DELIVERED'`, `deliveredAt=CURRENT_TIMESTAMP` for all entries where `user.id=userId` AND `status='SENT'`.
2. `markConversationMessagesAsRead(userId, conversationId)`: Updates `status='READ'`, `readAt=CURRENT_TIMESTAMP` for all entries where `user.id=userId` AND `message.conversation.id=conversationId` AND `status='DELIVERED'`.
3. `countUnreadMessagesByConversation(userId, conversationId)`: Counts entries where `user.id=userId` AND `message.conversation.id=conversationId` AND `status <> 'READ'`.
4. `countUnreadMessages(userId)`: Counts entries where `user.id=userId` AND `status <> 'READ'`.

#### OnlinePresenceEn (`online_presence_en` table)

| Field | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` | auto | Primary key |
| `user` | `UserEn` | `@OneToOne(fetch=LAZY)`, `@JoinColumn(name="user_id", nullable=false, unique=true)` | — | FK to user_en, unique |
| `lastSeenAt` | `LocalDateTime` | — | `null` | Last seen timestamp |

**Relationships:**
- `user` → `@OneToOne` → `UserEn` (LAZY)

---

## 6. API Endpoints

### Base URL: `http://{host}:{port}/chat-app/v1`

### 6.1 Authentication

#### POST `/auth/register`

Register a new user.

**Request Body (`RegisterReqDto`):**
```json
{
    "userId": "string (min 3 chars, required)",
    "password": "string (8-20 chars, must contain uppercase, lowercase, digit, special char @$!%*?&, required)",
    "avatarUrl": "string (optional)",
    "nickName": "string (required)"
}
```

**Response:** `201 Created`
```
User Created Successfully
```

**Errors:** `400 Bad Request` — invalid or missing details

---

#### POST `/auth/login`

Authenticate and receive a one-time session token.

**Request Body (`LogReqDto`):**
```json
{
    "userId": "string (min 3 chars, required)",
    "password": "string (8-20 chars, required)"
}
```

**Response (`LogResDto`):** `200 OK`
```json
{
    "userId": "string",
    "avatarUrl": "string",
    "nickName": "string",
    "token": "string (UUID)"
}
```

**Errors:**
- `404 Not Found` — user not found, inactive, or deleted
- `500 Internal Server Error` — if user is already logged in (token already created)

**Important:** The `token` is a one-time UUID. It is stored in `TokenRepo` (in-memory) and **deleted** upon successful WebSocket connection (see WebSocket section). It cannot be reused for subsequent WebSocket connections.

---

#### GET `/auth/health`

Health check.

**Response:** `200 OK`
```
Server is running
```

---

### 6.2 User

#### GET `/user/get/{userId}`

Get user profile by userId.

**Headers:** None required.

**Path Parameter:**
- `userId`: string (min 3 chars)

**Response (`UserResDto`):** `200 OK`
```json
{
    "userId": "string",
    "nickName": "string",
    "avatarUrl": "string",
    "online": true
}
```

`online` is determined by checking the in-memory `OnlineRepo` (real-time presence).

**Errors:**
- `400 Bad Request` — invalid userId
- `404 Not Found` — user not found, inactive, or soft-deleted

---

### 6.3 Conversations

#### POST `/conversation/create`

Get or create a conversation with another user.

**Headers:**
- `X-Sender-Id`: string — the current logged-in user's userId

**Request Body (`ConversationReqDto`):**
```json
{
    "receiverId": "string (min 3 chars, required)"
}
```

**Response (`ConversationDto` — basic) — BUT there is a bug (see Known Bugs):**
```json
{
    "conversationId": "null (BUG: always null)",
    "user_one": "string",
    "user_two": "string",
    "lastMessage": "datetime"
}
```

**Behavior:**
1. Sorts `senderId` and `receiverId` alphabetically to determine `userOne` and `userTwo`.
2. Checks for existing conversation by `(userOne, userTwo)`.
3. If found, returns it.
4. If not found, creates and persists a new `ConversationEn` with `lastMessageAt = now`.

---

#### GET `/conversation/get`

Get paginated list of conversations for a user.

**Headers:**
- `X-Sender-Id`: string — the user's userId

**Query Parameters:**
- `page`: int (default 0)
- `size`: int (default 20)
- `sort`: string (default `lastMessageAt,desc`)

**Response:** `200 OK`
```json
{
    "content": [
        {
            "id": "number",
            "userOne": { "userId": "string", ... },
            "userTwo": { "userId": "string", ... },
            "createdAt": "datetime",
            "updatedAt": "datetime",
            "active": true,
            "lastMessageAt": "datetime"
        }
    ],
    "pageable": "...",
    "totalElements": "number",
    ...
}
```

This endpoint returns raw `ConversationEn` entities directly (not DTOs). The `userOne` and `userTwo` fields are LAZY-loaded `UserEn` references.

---

#### GET `/conversation/get/conversationSummary`

Get paginated conversation summaries with unread counts and last message preview.

**Headers:**
- `X-User-Id`: string — the user's userId

**Query Parameters:**
- `page`: int (default 0)
- `size`: int (default 20)
- `sort`: string (default `lastMessageAt,desc`)

**Response (`ConversationSummaryResDto` page):** `200 OK`
```json
{
    "content": [
        {
            "conversationId": "number",
            "receiver": {
                "userId": "string",
                "nickName": "string",
                "avatarUrl": "string",
                "online": false
            },
            "lastMessage": "string",
            "lastMessageTime": "datetime",
            "unreadCount": "number"
        }
    ],
    "totalElements": "number",
    "totalPages": "number",
    "number": 0,
    ...
}
```

**Behavior per conversation:**
1. Finds the `UserEn` matching the current user (for display).
2. Counts unread messages via `MessageDeliveryRepo.countUnreadMessagesByConversation()`.
3. Fetches the most recent message content and timestamp.
4. If no messages exist, uses `conversationEn.getLastMessageAt()` as the timestamp.

---

### 6.4 Messages

#### POST `/messages/mark/read`

Mark all messages in a conversation as READ for the current user.

**Headers:**
- `X-UserId`: string — the current user's userId

**Request Body (`MarkReadReqDto`):**
```json
{
    "conversationId": "number (min 1, required)"
}
```

**Note:** The `@NotBlank` annotation on `conversationId` (Long field) is invalid — see Known Bugs.

**Response:** `200 OK`
```
[ N ] Messages mark as read
```

Where `N` is the count of messages updated (status changed from DELIVERED to READ).

**Important:** Only messages with `status='DELIVERED'` are marked as read. Messages with `status='SENT'` are NOT updated by this query.

---

#### GET `/messages/get/unreadCounts`

Get total unread message count for a user.

**Headers:**
- `X-UserId`: string

**Response:** `200 OK`
```
123
```

Returns a raw `Long` value (total count of delivery records with status ≠ READ).

---

#### GET `/messages/get/latestMessages`

**⚠️ BUG: Uses `@RequestBody` with `@GetMapping` — see Known Bugs.**

Get paginated messages for a conversation, ordered by `sentAt DESC`.

**Request Body (`MessageReadReqDto`):**
```json
{
    "conversationId": "number (required)"
}
```

**Query Parameters:**
- `page`: int (default 0)
- `size`: int (default 20)
- `sort`: string (default `sentAt,desc`)

**Response:** `200 OK`
```json
[
    {
        "id": "number",
        "conversation": { ... },
        "sender": { "userId": "string", ... },
        "receiver": { "userId": "string", ... },
        "content": "string",
        "sentAt": "datetime",
        "createdAt": "datetime"
    }
]
```

Returns raw `MessageEn` entities directly (not DTOs).

---

### 6.5 Online Presence

*(There are no HTTP endpoints for online presence — the following service methods exist but have NO exposed controller endpoints.)*

The following methods exist in `OnlinePresenceSer` but are **unreachable via HTTP**:

| Method | Purpose |
|---|---|
| `getLastSeen(userId)` | Get last seen timestamp for a user |
| `setLastFalse(userId)` | Update lastSeenAt to current time |
| `isOnline(userId)` | Check if user is in in-memory online map |
| `saveOnlineUser(userId, sessionId)` | Add user to in-memory online map |
| `removeOnlineUser(userId)` | Remove user from in-memory online map |
| `isSession(sessionId)` | Check if session is mapped |
| `getUserId(sessionId)` | Get userId by sessionId |

All of these are called internally by `WebSocketEventListeners` and `UserSer.isOnline()`.

---

## 7. WebSocket / STOMP Protocol

### Connection Setup

```
Client → STOMP CONNECT → ws://{host}:{port}/chat-app/v1/ws
```

**Endpoint:** `/ws` (with SockJS fallback)

**Headers required during CONNECT:**
- `token`: string — the one-time UUID token obtained from `POST /auth/login`

**Allowed origin:** `http://localhost:5173`

### Connection Lifecycle

#### On CONNECT (`WebSocketEventListeners.handleConnect`):

1. Extract `token` from STOMP native header `token`.
2. Validate token exists in `TokenRepo`.
3. Retrieve `userName` (userId) associated with token.
4. Check user is not already online. If already online → reject.
5. Save user + sessionId to `OnlineRepo` (in-memory).
6. Store `userId` in `StompHeaderAccessor.getSessionAttributes()` (key: `"userId"`).
7. Call `messageDeliverySer.markAsDelivered(userName)` — marks all SENT messages as DELIVERED.
8. **Delete token** from `TokenRepo` (one-time use).
9. If any step fails → `RuntimeException` → connection rejected.

#### On DISCONNECT (`WebSocketEventListeners.handleDisconnect`):

1. Extract `sessionId` from event.
2. Verify session exists in `OnlineRepo`.
3. Retrieve `userId` from session mapping.
4. Remove user from `OnlineRepo`.
5. (Note: `lastSeenAt` is NOT updated in `OnlinePresenceEn` on disconnect — this is only done via `setLastFalse` which is not called here.)

### Sending Messages

**Destination:** `/app/chat` (via STOMP SEND)

**Payload (`MessageReqDto`):**
```json
{
    "receiver": "string (min 3 chars, required)",
    "content": "string",
    "sendAt": "datetime (ISO-8601)"
}
```

**Handler:** `ChatCon.handleMessage()`

**Flow:**
1. Extract `senderId` from session attributes (`accessor.getSessionAttributes().get("userId")`).
2. Call `ChatSer.handleMessage(senderId, messageReqDto)`.
3. Inside `ChatSer`:
   a. Build destination: `/queue/messages/{receiverId}`
   b. Call `MessageSer.sendMessage(messageReqDto, senderId)`:
      - Validate sender and receiver exist and are active.
      - Sort sender/receiver to find/create `ConversationEn`.
      - Map `MessageReqDto` → `MessageEn` and save.
      - Call `MessageDeliverySer.createDelivery(messageEn)`:
        - Create `MessageDeliveryEn` with `status=SENT` for the receiver.
      - Map `MessageEn` → `MessageResDto`.
   c. Send `MessageResDto` to `/queue/messages/{receiverId}` via `SimpMessagingTemplate`.

### Receiving Messages

**Subscribe to:** `/queue/messages/{userId}`

**Received payload (`MessageResDto`):**
```json
{
    "content": "string",
    "senderId": "string",
    "receivedAt": "datetime"
}
```

### Broker Configuration

| Property | Value |
|---|---|
| Application Destination Prefix | `/app` |
| Simple Broker Prefixes | `/topic`, `/queue` |
| STOMP Endpoint | `/ws` |

### Note on `/topic` vs `/queue`

The broker is configured to handle both `/topic` (pub-sub) and `/queue` (point-to-point) prefixes. However, the application **only uses `/queue`** for message delivery. The `/topic` prefix is unused.

---

## 8. Security Model

### Summary

**There is NO Spring Security integration.** The security model is entirely custom and minimal:

| Concern | Implementation | Strength |
|---|---|---|
| Password storage | Plaintext in database | **None** — no hashing (BCrypt, etc.) |
| Authentication | UUID token stored in `ConcurrentHashMap` | Weak — tokens are predictable via `UUID.randomUUID()` |
| Token lifecycle | Created on login, deleted on WebSocket connect | One-time use |
| HTTP endpoint protection | No authentication required for any HTTP endpoint | **None** — any endpoint is accessible |
| WebSocket protection | Token validated in `SessionConnectEvent` listener | Present but minimal |
| CORS | Only `http://localhost:5173` allowed | Present |

### Authentication Flow

```
Register → (store plaintext password)
    ↓
Login → validate password → generate UUID token → store in TokenRepo → return token
    ↓
WebSocket Connect → validate token → mark DELIVERED → delete token → set session
    ↓
Subsequent HTTP requests → NO AUTH (anyone can call any endpoint)
```

### Critical Security Gaps

1. **No HTTP endpoint authentication.** Any client can call any HTTP API without a token.
2. **No password hashing.** Passwords are stored and compared in plaintext.
3. **No CSRF protection.**
4. **No rate limiting.**
5. **No input sanitization beyond Jakarta Validation.**

---

## 9. Data Flow Diagrams

### Registration Flow

```
Client                          Server                          DB
  │                               │                               │
  │  POST /auth/register          │                               │
  │  {userId, password, ...}      │                               │
  │ ───────────────────────────▶  │                               │
  │                               │  AuthSer.register()           │
  │                               │  └─ LoginMapper.toUserEn()    │
  │                               │  └─ userRep.save()            │
  │                               │ ──────────────────────────▶   │
  │                               │  ◀──────────────────────────  │
  │  ◀─────────────────────────── │                               │
  │  201 Created                  │                               │
```

### Login + WebSocket Connect Flow

```
Client                          Server                          DB
  │                               │                               │
  │  POST /auth/login             │                               │
  │  {userId, password}           │                               │
  │ ───────────────────────────▶  │                               │
  │                               │  AuthSer.login()              │
  │                               │  └─ userRep.findByUserId()    │
  │                               │  └─ LoginMapper.logResDto()   │
  │                               │  └─ tokenSer.createToken()   │
  │                               │     └─ TokenRepo.addToken()   │
  │  logResDto + token            │                               │
  │ ◀───────────────────────────  │                               │
  │                               │                               │
  │  STOMP CONNECT /ws            │                               │
  │  header: token=xxx            │                               │
  │ ───────────────────────────▶  │                               │
  │                               │  WebSocketEventListeners      │
  │                               │  └─ validate token            │
  │                               │  └─ saveOnlineUser()          │
  │                               │  └─ markAsDelivered()         │
  │                               │  └─ removeToken()             │
  │  CONNECTED                    │                               │
  │ ◀───────────────────────────  │                               │
```

### Send Message Flow

```
Sender Client                  Server                       Receiver Client
  │                               │                               │
  │  SEND /app/chat               │                               │
  │  {receiver, content}          │                               │
  │ ───────────────────────────▶  │                               │
  │                               │  ChatCon.handleMessage()      │
  │                               │  └─ ChatSer.handleMessage()   │
  │                               │     └─ MessageSer.sendMessage│
  │                               │        └─ save MessageEn      │
  │                               │        └─ createDelivery()    │
  │                               │           └─ save DeliveryEn  │
  │                               │           status=SENT         │
  │                               │     └─ toMessageResDto()      │
  │                               │     └─ convertAndSend()       │
  │                               │        /queue/messages/{rxId} │
  │                               │ ───────────────────────────▶  │
  │                               │                               │
  │                               │  MESSAGE body={content,       │
  │                               │    senderId, receivedAt}       │
  │                               │                               │
```

### Mark as Read Flow

```
Client                          Server                          DB
  │                               │                               │
  │  POST /messages/mark/read     │                               │
  │  header: X-UserId             │                               │
  │  {conversationId}             │                               │
  │ ───────────────────────────▶  │                               │
  │                               │  MessageDeliverySer           │
  │                               │  └─ validate conversation     │
  │                               │  └─ validate user             │
  │                               │  └─ markConversationAsRead()  │
  │                               │     UPDATE message_delivery   │
  │                               │     SET status='READ',        │
  │                               │         readAt=NOW            │
  │                               │     WHERE status='DELIVERED'  │
  │                               │ ──────────────────────────▶   │
  │  ◀─────────────────────────── │                               │
  │  [N] Messages mark as read    │                               │
```

---

## 10. Known Bugs and Limitations

### Critical Bugs

#### BUG-1: `ConversationMapper.toConversationDto()` — conversationId always null

**File:** `mapper/ConversationMapper.java:15`

```java
// BUG: should be conversationEn.getId()
conversationDto.setConversationId(conversationDto.getConversationId());
```

This sets the conversationId from itself (always null) instead of from `conversationEn.getId()`. The conversationId in the response is always null. The frontend cannot rely on this endpoint.

**Impact:** The `POST /conversation/create` response has `conversationId: null`. The frontend must use a different approach to get the conversation ID (e.g., via the summary endpoint).

#### BUG-2: `OnlinePresenceSer.saveOnlineUser()` — inverted condition

**File:** `service/OnlinePresenceSer.java:52`

```java
// BUG: should be !userExists
if(userExists)throw new RuntimeException("USer not found");
```

When `userExists` is true (user is found), it throws "User not found". This means the method always throws when the user exists. WebSocket connections will fail for any user that exists in the database.

**Impact:** This bug prevents any WebSocket connection from being established, breaking the entire messaging feature.

#### BUG-3: `MarkReadReqDto` — invalid `@NotBlank` on Long field

**File:** `dto/message/MarkReadReqDto.java:19`

```java
@NotBlank(message = "Conversation id cannot be blank")  // INVALID on Long
private Long conversationId;
```

`@NotBlank` is a String-only annotation. Applied to a `Long`, it causes a validation error or is silently ignored (behavior depends on the validation implementation). Should be `@NotNull` only.

**Impact:** May cause validation failures when marking messages as read.

#### BUG-4: `MessageCon.getLatestConversationMessages()` — GET with request body

**File:** `controller/MessageCon.java:38`

```java
@GetMapping("/get/latestMessages")
public ResponseEntity<?> getLatestConversationMessages(
    @Valid @RequestBody MessageReadReqDto messageReadReqDto, ...
```

`@GetMapping` + `@RequestBody` is non-standard. Many HTTP clients and servers do not support request bodies on GET requests. This endpoint may not work as expected.

**Impact:** Cannot fetch latest messages for a conversation.

### Design Issues

#### ISSUE-1: No password hashing

Passwords are stored and compared in plaintext. This is a security vulnerability.

#### ISSUE-2: No HTTP authentication

All REST endpoints are publicly accessible without any token/session validation. The connection between the login token and the API calls relies entirely on header-based userId parameters (`X-Sender-Id`, `X-UserId`, etc.) which are not verified.

#### ISSUE-3: `MessageEn.sentAt` and `createdAt` are redundant

Both fields use `@CreationTimestamp` and will always have identical values. One should be removed.

#### ISSUE-4: No global exception handler

No `@ControllerAdvice` or `@ExceptionHandler`. RuntimeExceptions thrown in services are not caught, resulting in `500 Internal Server Error` with stack traces exposed to the client.

#### ISSUE-5: `setLastFalse` is misnamed

The method `OnlinePresenceSer.setLastFalse()` actually sets `lastSeenAt` to `LocalDateTime.now()`. The name suggests setting something to false. Additionally, this method is never called on disconnect, so last seen timestamps are never updated.

#### ISSUE-6: No limit on message content

The `content` field is `TEXT` type with no `@Size` constraint. Extremely large messages can be sent.

#### ISSUE-7: Conversation listing returns entities directly

`GET /conversation/get` returns raw `ConversationEn` entities rather than a DTO. This exposes all entity fields, including LAZY-loaded associations that may cause `LazyInitializationException` if the session is closed.

#### ISSUE-8: Message listing returns entities directly

`GET /messages/get/latestMessages` returns raw `MessageEn` entities. Same issue as above.

### Missing Features

1. **No typing indicators** — No WebSocket support for "user is typing" events.
2. **No image/file attachment support** — Only text content.
3. **No group chat** — Only one-to-one conversations.
4. **No message editing or deletion** — Messages cannot be edited or deleted.
5. **No push notification support** — No integration with Firebase/APNs.
6. **No message search** — No endpoint to search across messages.
7. **No user search/discovery** — No endpoint to find users by name/pattern.
8. **No rate limiting** — No protection against spam.

### In-Memory Data Volatility

Both `TokenRepo` and `OnlineRepo` use `ConcurrentHashMap`. Data is lost on:
- Server restart
- Application deploy
- Server crash

This means:
- All active tokens are invalidated on restart (users must re-login).
- All online presence data is reset on restart.
- In a multi-instance deployment, these would not be shared across instances.

---

## 11. Design Patterns Used

| Pattern | Location | Description |
|---|---|---|
| **Layered Architecture** | Full project | Controller → Service → Repository |
| **Data Transfer Object (DTO)** | `dto/` package | Separate request/response models from entities |
| **Mapper (Converter)** | `mapper/` package | Static methods for Entity ↔ DTO conversion |
| **Singleton** | `OnlineRepo`, `TokenRepo` | Spring `@Component` beans |
| **In-Memory Cache** | `OnlineRepo`, `TokenRepo` | `ConcurrentHashMap` for fast lookups |
| **Event Listener** | `WebSocketEventListeners` | `@EventListener` for session lifecycle |
| **Template Method** | `WebSocketConfig` | Implements `WebSocketMessageBrokerConfigurer` |

---

## Appendix A: Application Properties

```properties
spring.application.name=chat-bakend
server.servlet.context-path=/chat-app/v1
spring.datasource.url=jdbc:mysql://localhost:3306/chat_app?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=shivam
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

## Appendix B: Legacy/Unused Classes

The following classes exist in the codebase but are **not referenced** anywhere:

- `model/ChatMessage.java` — Plain POJO with `messageId`, `content`, `receiverId`, `sendAt`
- `model/UserMod.java` — Plain POJO with `userID`, `sessionID`, `createdAt`, `isOnline`
