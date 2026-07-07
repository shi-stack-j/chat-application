# Backend-Frontend Integration Guide

## Chat Application Backend Analysis

---

# 1. Project Architecture

## 1.1 Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Spring Boot 4.0.6 |
| Java | JDK 21 |
| Database | MySQL (mysql-connector-j) |
| ORM | Spring Data JPA (Hibernate) |
| Validation | Spring Boot Validation (Jakarta) |
| Web | Spring WebMVC |
| Realtime | Spring WebSocket (STOMP over SockJS) |
| Build | Maven |
| Others | Lombok |

## 1.2 Package Structure & Responsibility

```
com.shiv.chat_bakend/
├── ChatBakendApplication.java        # Spring Boot entry point
├── configuration/                    # App configuration classes
│   ├── CorsConfig.java               # CORS policy (port 5173)
│   └── WebSocketConfig.java          # STOMP/WebSocket endpoints & broker
├── controller/                       # REST & STOMP endpoints
│   ├── AuthCon.java                  # Register & Login REST endpoints
│   ├── UserCon.java                  # Get user by userId
│   ├── ConversationCon.java          # Create/get conversations, get summaries
│   ├── MessageCon.java               # Messages CRUD, delivery status, unread counts
│   ├── ChatCon.java                  # WebSocket message handler (@MessageMapping)
│   └── TestCon.java                  # Test endpoint (unused in production)
├── dto/                              # Data Transfer Objects
│   ├── auth/                         # Login/Register DTOs
│   ├── conversation/                 # Conversation request/response DTOs
│   ├── message/                      # Message request/response/status DTOs
│   └── user/                         # User & online presence DTOs
├── enums/
│   └── MessageStatusEnum.java        # SENT, DELIVERED, READ
├── mapper/                           # Entity ↔ DTO conversion utilities
│   ├── LoginMapper.java
│   ├── UserMapper.java
│   ├── ConversationMapper.java
│   ├── MessageMapper.java
│   ├── MessageDeliveryMapper.java
│   └── OnlinePresenceMapper.java
├── model/                            # JPA Entities
│   ├── UserEn.java
│   ├── ConversationEn.java
│   ├── MessageEn.java
│   ├── MessageDeliveryEn.java
│   ├── OnlinePresenceEn.java
│   └── OnlineUserSession.java        # NOT an entity; in-memory POJO
├── repository/                       # Data access layer
│   ├── UserRep.java                  # JPA repository for UserEn
│   ├── ConversationRepo.java         # JPA repository for ConversationEn
│   ├── MessageRepo.java              # JPA repository for MessageEn
│   ├── MessageDeliveryRepo.java      # JPA repository for MessageDeliveryEn
│   ├── OnlinePresenceRepo.java       # JPA repository for OnlinePresenceEn
│   ├── TokenRepo.java                # In-memory token store (ConcurrentHashMap)
│   └── OnlineRepo.java               # In-memory online user session store
└── service/                          # Business logic layer
    ├── AuthSer.java                  # Register & login logic
    ├── UserSer.java                  # User retrieval & online status
    ├── TokenSer.java                 # Token creation, validation, removal
    ├── ConversationSer.java          # Conversation CRUD, summary generation
    ├── MessageSer.java               # Message sending, fetching
    ├── MessageDeliverySer.java       # Delivery status management
    ├── ChatSer.java                  # WebSocket message routing & broadcast
    ├── OnlinePresenceSer.java        # Online/offline state management
    └── WebSocketEventListeners.java  # Connect/disconnect event handlers
```

## 1.3 Application Properties

**File**: `src/main/resources/application.properties`

| Property | Value | Purpose |
|----------|-------|---------|
| `spring.application.name` | `chat-bakend` | Application name |
| `server.servlet.context-path` | `/chat-app/v1` | Base URL path for all REST APIs |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/chat_app?createDatabaseIfNotExist=true` | MySQL connection URL; auto-creates DB |
| `spring.datasource.username` | `root` | DB username |
| `spring.datasource.password` | `shivam` | DB password |
| `spring.jpa.hibernate.ddl-auto` | `update` | Hibernate auto-creates/updates tables |
| `spring.jpa.show-sql` | `true` | Logs SQL queries (dev mode) |

**Base URL**: All REST endpoints are prefixed with: `http://{host}:{port}/chat-app/v1`

## 1.4 CORS Configuration

**File**: `CorsConfig.java`

| Setting | Value |
|---------|-------|
| Allowed Origins | `http://localhost:5173` (Vite dev server) |
| Allowed Methods | `GET`, `POST` only |
| Allow Credentials | `true` |
| Allowed Headers | `*` |

---

# 2. Database Design

## 2.1 Entity: UserEn

**Table**: `user_en`

**Purpose**: Stores registered user accounts with soft-delete support.

**Fields**:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long (PK) | AUTO_INCREMENT | Primary key |
| user_id | String | NOT NULL, UNIQUE, min 3 chars | Business key / username (the identifier used everywhere) |
| nick_name | String | NOT NULL | Display name |
| password | String | NOT NULL, min 8 max 20, must contain uppercase, lowercase, digit, special char | **STORED AS PLAIN TEXT (no hashing)** |
| avatar_url | String | nullable | Profile picture URL |
| is_active | boolean | default true | Account active flag |
| deleted | boolean | default false | Soft delete flag |
| created_at | LocalDateTime | AUTO (CreationTimestamp) | Account creation time |
| updated_at | LocalDateTime | AUTO (UpdateTimestamp) | Last update time |
| deactivated_on | LocalDateTime | nullable | When account was deactivated |
| deleted_on | LocalDateTime | nullable | When account was soft-deleted |

**Relationships**: None directly defined (referenced by other entities)

## 2.2 Entity: ConversationEn

**Table**: `conversation_en`

**Purpose**: Represents a 1-to-1 chat conversation between two users. No group chat support.

**Fields**:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long (PK) | AUTO_INCREMENT | Primary key |
| user_one_id | Long (FK → UserEn.id) | NOT NULL | First user (deterministically ordered - alphabetically) |
| user_two_id | Long (FK → UserEn.id) | NOT NULL | Second user |
| created_at | LocalDateTime | AUTO (CreationTimestamp) | Conversation creation time |
| updated_at | LocalDateTime | AUTO (UpdateTimestamp) | Last update time |
| active | boolean | default true | Whether conversation is active |
| last_message_at | LocalDateTime | nullable | Timestamp of the last message sent |

**Constraints**:
- `UNIQUE(user_one_id, user_two_id)` - Ensures only one conversation between any pair
- `INDEX idx_conversation_users(user_one_id, user_two_id)`
- Users are sorted alphabetically by userId to determine `user_one` vs `user_two`

**Relationships**:

| Relationship | Type | Target | FK Column | Fetch |
|-------------|------|--------|-----------|-------|
| userOne | ManyToOne | UserEn | user_one_id | LAZY |
| userTwo | ManyToOne | UserEn | user_two_id | LAZY |

## 2.3 Entity: MessageEn

**Table**: `messages`

**Purpose**: Stores individual messages within conversations.

**Fields**:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long (PK) | AUTO_INCREMENT | Primary key |
| conversation_id | Long (FK → ConversationEn.id) | NOT NULL | Parent conversation |
| sender_id | Long (FK → UserEn.id) | NOT NULL | Who sent the message |
| receiver_id | Long (FK → UserEn.id) | NOT NULL | Who receives the message |
| content | String (TEXT) | NOT NULL | Message body |
| sent_at | LocalDateTime | AUTO (CreationTimestamp) | When message was sent |
| created_at | LocalDateTime | AUTO (CreationTimestamp) | Row creation time |

**Indexes**:
- `idx_message_conversation(conversation_id)`
- `idx_message_created(created_at)`

**Relationships**:

| Relationship | Type | Target | FK Column | Fetch |
|-------------|------|--------|-----------|-------|
| conversation | ManyToOne | ConversationEn | conversation_id | LAZY |
| sender | ManyToOne | UserEn | sender_id | LAZY |
| receiver | ManyToOne | UserEn | receiver_id | LAZY |

## 2.4 Entity: MessageDeliveryEn

**Table**: `message_delivery`

**Purpose**: Tracks delivery status of each message per recipient user. This is the read-receipt / delivery-receipt mechanism.

**Fields**:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long (PK) | AUTO_INCREMENT | Primary key |
| message_id | Long (FK → MessageEn.id) | NOT NULL | Which message |
| user_id | Long (FK → UserEn.id) | NOT NULL | Which user this status is for |
| status | String (Enum) | NOT NULL | `SENT`, `DELIVERED`, `READ` |
| delivered_at | LocalDateTime | nullable | When it was delivered |
| read_at | LocalDateTime | nullable | When it was read |

**Indexes**:
- `idx_delivery_message(message_id)`
- `idx_delivery_user(user_id)`

**Relationships**:

| Relationship | Type | Target | FK Column | Fetch |
|-------------|------|--------|-----------|-------|
| message | ManyToOne | MessageEn | message_id | LAZY |
| user | ManyToOne | UserEn | user_id | LAZY |

**Status Lifecycle**: `SENT → DELIVERED → READ` (one direction only)

## 2.5 Entity: OnlinePresenceEn

**Table**: `online_presence_en`

**Purpose**: Persistently stores the last-seen timestamp for each user.

**Fields**:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long (PK) | AUTO_INCREMENT | Primary key |
| user_id | Long (FK → UserEn.id) | NOT NULL, UNIQUE | One record per user |
| last_seen_at | LocalDateTime | nullable | Last time user was online |

**Relationships**:

| Relationship | Type | Target | FK Column | Fetch |
|-------------|------|--------|-----------|-------|
| user | OneToOne | UserEn | user_id | LAZY |

## 2.6 NON-Entity: OnlineUserSession

**Not a JPA entity.** This is an in-memory POJO stored in `OnlineRepo` (ConcurrentHashMap).

**Fields**:

| Field | Type | Notes |
|-------|------|-------|
| userId | String | The business key (userId) |
| sessionId | String | WebSocket session ID |

**Purpose**: Maps a WebSocket session to a logged-in user in memory.

---

## 2.7 ER Diagram (Text Format)

```
USER_EN (1) ──────< (N) CONVERSATION_EN (as userOne)
USER_EN (1) ──────< (N) CONVERSATION_EN (as userTwo)
CONVERSATION_EN (1) ──────< (N) MESSAGES
USER_EN (1) ──────< (N) MESSAGES (as sender)
USER_EN (1) ──────< (N) MESSAGES (as receiver)
MESSAGES (1) ──────< (N) MESSAGE_DELIVERY
USER_EN (1) ──────< (N) MESSAGE_DELIVERY
USER_EN (1) ────── (1) ONLINE_PRESENCE_EN
```

**Relationship Summary**:
- `UserEn` ↔ `ConversationEn`: One user can have many conversations (as userOne or userTwo)
- `ConversationEn` → `MessageEn`: One conversation has many messages
- `UserEn` → `MessageEn`: One user sends many messages (sender)
- `UserEn` → `MessageEn`: One user receives many messages (receiver)
- `MessageEn` → `MessageDeliveryEn`: One message has one delivery tracking record
- `UserEn` → `MessageDeliveryEn`: One user has many delivery records
- `UserEn` ↔ `OnlinePresenceEn`: One user has one last-seen record (OneToOne)

---

# 3. Authentication Flow

## 3.1 Important: No Spring Security

The application does **not** use Spring Security. Authentication is a custom implementation using:
- In-memory UUID tokens (stored in `ConcurrentHashMap`)
- No password hashing (plain text comparison)
- No JWT
- No OAuth2

## 3.2 Registration Flow

```
Frontend                           Backend
   │                                  │
   │  POST /auth/register             │
   │  Body: RegisterReqDto            │
   │─────────────────────────────────>│
   │                                  │ AuthSer.register()
   │                                  │  ├── Validate fields
   │                                  │  ├── LoginMapper.toUserEn(dto)
   │                                  │  └── UserRep.save(userEn)
   │ 201 Created                      │
   │ "User Created Successfully"      │
   │<─────────────────────────────────│
```

**Request DTO** (`RegisterReqDto`):
- `userId` (String) - min 3 chars, required
- `password` (String) - min 8 max 20, must contain uppercase + lowercase + digit + special char
- `avatarUrl` (String) - optional
- `nickName` (String) - required

**Response**: Status 201 with string message.

**Security Issues**: Password stored as plain text. No `@Valid` on nickName in entity.

## 3.3 Login Flow

```
Frontend                           Backend
   │                                  │
   │  POST /auth/login                │
   │  Body: LogReqDto                 │
   │─────────────────────────────────>│
   │                                  │ AuthSer.login()
   │                                  │  ├── Find user by userId
   │                                  │  ├── Check active & not deleted
   │                                  │  ├── TokenSer.createToken(userId)
   │                                  │  │     ├── Check user not already online
   │                                  │  │     ├── Generate UUID.randomUUID()
   │                                  │  │     └── Store in TokenRepo (ConcurrentHashMap)
   │                                  │  └── Return LogResDto
   │ 200 OK                           │
   │ {userId, nickName, avatarUrl,    │
   │  token: "uuid-string"}           │
   │<─────────────────────────────────│
```

**Request DTO** (`LogReqDto`):
- `userId` (String) - min 3 chars, required
- `password` (String) - min 8 max 20, complex requirements

**Response DTO** (`LogResDto`):
- `userId`: String
- `nickName`: String
- `avatarUrl`: String (empty string if null)
- `token`: String (UUID)

## 3.4 Token Structure & Management

| Aspect | Detail |
|--------|--------|
| Type | UUID (random string, e.g., `550e8400-e29b-41d4-a716-446655440000`) |
| Storage | In-memory `ConcurrentHashMap<String token, String userId>` |
| Persistence | **NOT persisted** - lost on server restart |
| Lifecycle | Created on login → Used during WS connect → Removed after WS connect |
| What's inside | Nothing; the token itself is the key, maps to userId |

## 3.5 Token Lifecycle

1. **Login**: Token generated, stored in memory, returned to frontend
2. **WebSocket Connect**: Frontend sends token as STOMP header `token`
3. **Validation**: `WebSocketEventListeners.handleConnect()` validates token exists, extracts userId, saves user as online, **then removes the token** (one-time use)
4. **After WS Connect**: Token is deleted. No subsequent REST API uses token for auth.

## 3.6 How Frontend Authenticates

### REST API Authentication
- There is **no token-based auth** for REST APIs.
- Authentication is done by sending the `userId` as a **custom header**:
  - `X-Sender-Id`: For identifying the sender
  - `X-User-Id`: For identifying the current user
  - `X-UserId`: For message-related operations
- **Security Issue**: Anyone can impersonate any user simply by changing the header value.

### WebSocket Authentication
- During STOMP connect, send a `token` header with the UUID token
- Backend validates the token exists, extracts userId, puts userId into session attributes
- Token is then deleted (one-time use)

## 3.7 Complete Auth Lifecycle

```
1. REGISTER
   │
   ├─ POST /chat-app/v1/auth/register
   │  { userId, password, nickName, avatarUrl? }
   │
   └─ User created in database

2. LOGIN
   │
   ├─ POST /chat-app/v1/auth/login
   │  { userId, password }
   │
   └─ Response: { userId, nickName, avatarUrl, token: "uuid" }

3. WEBSOCKET CONNECT
   │
   ├─ Connect to ws://{host}/chat-app/v1/ws (SockJS)
   ├─ STOMP headers: { token: "uuid" }
   │
   ├─ Backend validates token
   ├─ Backend marks user as online
   ├─ Backend marks all pending messages as DELIVERED
   ├─ Backend removes token (one-time use)
   └─ Connection established

4. USE APIS
   │
   ├─ REST APIs: pass userId via custom header
   ├─ WebSocket: session has userId in attributes
   └─ Session stays valid until disconnect
```

---

# 4. WebSocket / STOMP Configuration

## 4.1 Connection Details

| Setting | Value |
|---------|-------|
| WebSocket Endpoint | `/chat-app/v1/ws` |
| SockJS | Enabled (fallback) |
| Allowed Origins | `http://localhost:5173` |
| Application Destination Prefix | `/app` |
| Broker Prefixes | `/topic`, `/queue` |
| STOMP Protocol | Full STOMP via SockJS |

## 4.2 How Frontend Connects

**STOMP Connect Headers**:
```javascript
const headers = {
  token: "uuid-from-login-response"
};
const socket = new SockJS("http://localhost:8080/chat-app/v1/ws");
const stompClient = Stomp.over(socket);
stompClient.connect(headers, onConnect, onError);
```

## 4.3 Topics & Queues

| Destination | Direction | Purpose |
|-------------|-----------|---------|
| `/app/chat` | Frontend → Backend | Send chat message |
| `/queue/messages/{userId}` | Backend → Frontend | Receive real-time messages |
| `/topic/**` | Reserved (not used currently) | General broadcasts |
| `/queue/**` | Backend → Frontend | User-specific messages |

## 4.4 Message Mappings

### Sending Messages (Frontend → Backend)

**STOMP Destination**: `/app/chat`

**Body** (`MessageReqDto`):
```json
{
  "receiver": "otherUserId",
  "content": "Hello!",
  "sendAt": null  // auto-set by backend
}
```

**Processing by** `ChatCon.handleMessage()`:
1. Extract `senderId` from session attributes (`accessor.getSessionAttributes().get("userId")`)
2. Call `ChatSer.handleMessage(senderId, messageReqDto)`
3. `ChatSer` calls `MessageSer.sendMessage()` which:
   - Validates sender & receiver exist
   - Finds/validates conversation
   - Creates MessageEn entity
   - Creates MessageDeliveryEn (status SENT)
   - Updates conversation's lastMessageAt
   - Returns MessageResDto
4. `ChatSer` broadcasts via `SimpMessagingTemplate.convertAndSend()` to `/queue/messages/{receiverId}`

**Important**: The sender's message does NOT get broadcast back to them. Only the receiver gets the real-time message.

### Receiving Messages (Backend → Frontend)

**STOMP Subscription**: `/queue/messages/{userId}`

**Payload** (`MessageResDto`):
```json
{
  "conversationId": 1,
  "content": "Hello!",
  "senderId": "otherUserId",
  "receivedAt": "2026-06-29T12:00:00"
}
```

## 4.5 WebSocket Events

### Connection Event (`handleConnect`)

Triggered when a STOMP connection is established.

```
Socket connects
  │
  ├─ Extract "token" from STOMP headers
  ├─ Validate token exists in TokenRepo
  ├─ Extract userId from token
  ├─ Check user is not already online
  ├─ Store session: OnlineUserSession(userId, sessionId)
  ├─ Put "userId" into session attributes
  ├─ Mark all pending messages as DELIVERED (via MessageDeliverySer.markAsDelivered)
  ├─ Remove token from TokenRepo (one-time use)
  └─ Connection ready
```

### Disconnect Event (`handleDisconnect`)

Triggered when a STOMP connection is closed.

```
Socket disconnects
  │
  ├─ Extract sessionId from event
  ├─ Validate session exists
  ├─ Get userId from session
  ├─ Remove user from online users map
  └─ (Note: Does NOT update OnlinePresenceEn lastSeenAt)
```

## 4.6 Frontend WebSocket Lifecycle

```
1. LOGIN SUCCESS
   │  Store: token, userId, nickName, avatarUrl
   │
2. CONNECT WEBSOCKET
   │  stompClient.connect({ token }, onConnect)
   │
3. ON CONNECT (callback)
   │  ├─ Subscribe to: /queue/messages/{userId}
   │  ├─ Load conversations list (GET /conversation/get)
   │  └─ Update UI: user is online
   │
4. SEND MESSAGE
   │  stompClient.send("/app/chat", {}, JSON.stringify({
   │    receiver: "otherUserId",
   │    content: "Hello!"
   │  }))
   │
5. RECEIVE MESSAGE (callback from subscription)
   │  ├─ Parse MessageResDto
   │  ├─ Update messages state for conversationId
   │  ├─ Update conversation summary (last message)
   │  └─ Update UI
   │
6. DISCONNECT
   │  └─ Backend auto-marks user offline
```

---

# 5. REST API Documentation

## 5.1 Auth APIs

### 5.1.1 Register User

| Attribute | Value |
|-----------|-------|
| API Name | Register User |
| Method | `POST` |
| URL | `/chat-app/v1/auth/register` |
| Auth | None |
| Content-Type | `application/json` |

**Request Body**:
```json
{
  "userId": "john_doe",
  "password": "John@123",
  "nickName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Validation Rules**:
- `userId`: min 3 chars, not blank
- `password`: min 8 max 20, must contain 1 uppercase, 1 lowercase, 1 digit, 1 special char (`@$!%*?&`)
- `nickName`: not blank
- `avatarUrl`: optional

**Success Response** (201):
```
"User Created Successfully"
```

**Error Responses**:
- 400: `"Provide valid registration details"` / `"Provide valid Details"`

**Frontend Usage**: Called on registration form submit.

---

### 5.1.2 Login User

| Attribute | Value |
|-----------|-------|
| API Name | Login User |
| Method | `POST` |
| URL | `/chat-app/v1/auth/login` |
| Auth | None |
| Content-Type | `application/json` |

**Request Body**:
```json
{
  "userId": "john_doe",
  "password": "John@123"
}
```

**Success Response** (200):
```json
{
  "userId": "john_doe",
  "nickName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:
- 404: `"User not found"`
- 400: (validation errors)

**Frontend Usage**:
1. Call on login form submit
2. Store `token`, `userId`, `nickName`, `avatarUrl` in state/localStorage
3. Use `token` to connect WebSocket

---

### 5.1.3 Health Check

| Attribute | Value |
|-----------|-------|
| API Name | Health Check |
| Method | `GET` |
| URL | `/chat-app/v1/auth/health` |
| Auth | None |

**Response**: `"Server is running"`

---

## 5.2 User APIs

### 5.2.1 Get User by ID

| Attribute | Value |
|-----------|-------|
| API Name | Get User |
| Method | `GET` |
| URL | `/chat-app/v1/user/get/{userId}` |
| Auth | None (just provides userId as path variable) |
| Params | `userId` - path variable, min 3 chars |

**Success Response** (200):
```json
{
  "userId": "john_doe",
  "nickName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "isOnline": true
}
```

**Error Responses**:
- 404: `"User Not found with the given id"`
- 400: `"Userid is not Valid"`

**Frontend Usage**: Search for a user before starting a conversation, or display user profile.

**Note**: `isOnline` is determined by checking in-memory `OnlineRepo` (whether user has active WebSocket session).

---

## 5.3 Conversation APIs

### 5.3.1 Get or Create Conversation

| Attribute | Value |
|-----------|-------|
| API Name | Get or Create Conversation |
| Method | `POST` |
| URL | `/chat-app/v1/conversation/create` |
| Auth | Via `X-Sender-Id` header |
| Headers | `X-Sender-Id: currentUserId` |
| Content-Type | `application/json` |

**Request Body**:
```json
{
  "receiverId": "jane_doe"
}
```

**Validation**:
- `receiverId`: min 3 chars, not null

**Success Response** (200):
```json
{
  "conversationId": 1,
  "user_one": "jane_doe",
  "user_two": "john_doe",
  "lastMessage": "2026-06-29T12:00:00"
}
```

**If conversation already exists**: Returns existing conversation.
**If not**: Creates new conversation.

**Logic**:
- Users are sorted alphabetically → user_one is the smaller, user_two is the larger
- Checks if conversation exists by (user_one, user_two)
- If yes, return it
- If no, create new conversation

**Error Responses**:
- 400: `"Conversation object is not valid"`
- 500: `"Error while creating the conversation"`

**Frontend Usage**:
- Called when user initiates a chat with another user
- Should be called once per conversation creation; then use conversationId for messaging

---

### 5.3.2 Get User Conversations

| Attribute | Value |
|-----------|-------|
| API Name | Get User Conversations |
| Method | `GET` |
| URL | `/chat-app/v1/conversation/get` |
| Auth | Via `X-Sender-Id` header |
| Headers | `X-Sender-Id: currentUserId` |
| Query Params | `page`, `size`, `sort` (Spring Data Pageable) |

**Default Pagination**: page=0, size=20, sort=lastMessageAt,DESC

**Success Response** (200): Spring Data `Page<ConversationEn>` (raw entity, not recommended for frontend - use `/conversation/get/conversationSummary` instead)

**Frontend Usage**: Used to list all conversations. However, the recommended endpoint for frontend is the summary endpoint below.

---

### 5.3.3 Get Conversation Summary

| Attribute | Value |
|-----------|-------|
| API Name | Get Conversation Summary |
| Method | `GET` |
| URL | `/chat-app/v1/conversation/get/conversationSummary` |
| Auth | Via `X-User-Id` header |
| Headers | `X-User-Id: currentUserId` |
| Query Params | `page`, `size`, `sort` (Spring Data Pageable) |

**Default Pagination**: page=0, size=20, sort=lastMessageAt,DESC

**Success Response** (200): Spring Data `Page<ConversationSummaryResDto>`
```json
{
  "content": [
    {
      "conversationId": 1,
      "receiver": {
        "userId": "jane_doe",
        "nickName": "Jane Doe",
        "avatarUrl": "https://example.com/avatar.jpg",
        "isOnline": true
      },
      "lastMessage": "Hello!",
      "lastMessageTime": "2026-06-29T12:00:00",
      "unreadCount": 3
    }
  ],
  "pageable": { ... },
  "totalElements": 1,
  "totalPages": 1,
  ...
}
```

**Note**: `receiver.isOnline` is currently always set to `true` in the backend code (line 73 of ConversationSer.java - there is a bug: `UserMapper.toUserResDto(userEn, true)` passes hardcoded `true` instead of checking actual online status).

**Frontend Usage**:
- Primary endpoint for the chat list / sidebar
- Each item shows conversationId, receiver info, last message preview, unread count
- Implement infinite scrolling with Spring Data Pageable

---

## 5.4 Message APIs

### 5.4.1 Get Latest Conversation Messages

| Attribute | Value |
|-----------|-------|
| API Name | Get Conversation Messages |
| Method | `POST` |
| URL | `/chat-app/v1/messages/get/latestMessages` |
| Auth | None (No user header required) |
| Content-Type | `application/json` |
| Query Params | `page`, `size`, `sort` (Spring Data Pageable) |

**Request Body**:
```json
{
  "conversationId": 1
}
```

**Validation**:
- `conversationId`: min value 1, not null

**Default Pagination**: page=0, size=20, sort=sentAt,DESC

**Success Response** (200): Spring Data `Page<MessageResDto>`
```json
{
  "content": [
    {
      "conversationId": 1,
      "content": "Hello!",
      "senderId": "john_doe",
      "receivedAt": "2026-06-29T12:00:00"
    }
  ],
  "pageable": {
    "sort": { "sorted": true, "unsorted": false },
    "pageNumber": 0,
    "pageSize": 20,
    ...
  },
  "last": false,
  "totalPages": 3,
  ...
}
```

**Important**: Messages are ordered by `sentAt DESC` (newest first). For chat UI (oldest at top), frontend should reverse the array.

**Frontend Usage**:
- Load messages for a specific conversation
- Implement infinite scroll: page 0 = latest 20 messages
  - Scroll up → load page 1 (next 20 older messages)
  - Prepend older messages to the top of the list

---

### 5.4.2 Send Message (REST - Fallback)

| Attribute | Value |
|-----------|-------|
| API Name | Send Message (REST) |
| Method | `POST` |
| URL | `/chat-app/v1/messages/send/message/` |
| Auth | Via `X-Sender-Id` and `X-Conversation-Id` headers |
| Headers | `X-Sender-Id: currentUserId`, `X-Conversation-Id: 1` |
| Content-Type | `application/json` |

**Request Body**:
```json
{
  "receiver": "jane_doe",
  "content": "Hello!",
  "sendAt": null
}
```

**Success Response** (200): `"Message Sent successfully"`

**Error Responses**:
- 400: `"Conversation id is not valid"`

**Note**: This is a REST fallback for sending messages. The primary method is via WebSocket (`/app/chat`). However, this does NOT broadcast the message via WebSocket; it only saves to DB.

**Frontend Usage**: Use WebSocket for real-time message sending. Use this REST endpoint as fallback if WebSocket is disconnected.

---

### 5.4.3 Mark Messages as Read

| Attribute | Value |
|-----------|-------|
| API Name | Mark as Read |
| Method | `POST` |
| URL | `/chat-app/v1/messages/mark/read` |
| Auth | Via `X-User-Id` header |
| Headers | `X-User-Id: currentUserId` |
| Content-Type | `application/json` |

**Request Body**:
```json
{
  "conversationId": 1
}
```

**Success Response** (200): `"[ 5 ] Messages mark as read"`

**Logic**:
- Updates all `MessageDeliveryEn` records for the given user+conversation that have status `DELIVERED` → sets status to `READ` and sets `readAt`
- Only marks messages that are in `DELIVERED` status (not directly from `SENT`)

**Error Responses**:
- 400: `"Conversation or User not found"`

**Frontend Usage**:
- Call when user opens a conversation or when the conversation is in view
- Updates the read status backend-side
- Frontend should also update local unread count to 0 for that conversation

---

### 5.4.4 Mark Messages as Delivered

| Attribute | Value |
|-----------|-------|
| API Name | Mark as Delivered |
| Method | `POST` |
| URL | `/chat-app/v1/messages/mark/delivered` |
| Auth | Via `X-User-Id` header |
| Headers | `X-User-Id: currentUserId` |

**Success Response** (200): `"[ 3 ] Messages mark as Delivered"`

**Logic**:
- Updates all `MessageDeliveryEn` records for the given user that have status `SENT` → sets status to `DELIVERED` and sets `deliveredAt`

**Note**: This is also called automatically during WebSocket connect in `WebSocketEventListeners.handleConnect()`.

**Frontend Usage**:
- Call when user establishes WebSocket connection (as backup to auto-call)
- Call when app comes to foreground

---

### 5.4.5 Get Unread Counts (Total)

| Attribute | Value |
|-----------|-------|
| API Name | Get Total Unread Counts |
| Method | `GET` |
| URL | `/chat-app/v1/messages/get/unreadCounts` |
| Auth | Via `X-UserId` header |
| Headers | `X-UserId: currentUserId` |

**Success Response** (200): `7` (plain number - unread count across all conversations)

**Logic**: Counts all `MessageDeliveryEn` records where `user.userId = currentUser` AND `status != 'READ'` (i.e., SENT + DELIVERED).

**Frontend Usage**: Display total unread badge on the chat icon.

---

## 5.5 Test API (Not for Production)

| Attribute | Value |
|-----------|-------|
| API Name | Test Count |
| Method | `GET` |
| URL | `/chat-app/v1/test/count?cId=1&uId=john_doe` |
| Auth | None |

**Response**: Unread count for conversation.

---

# 6. DTO Analysis

## 6.1 Auth DTOs

### RegisterReqDto
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| userId | String | min 3 chars, not blank | Yes |
| password | String | min 8 max 20, regex: must contain uppercase, lowercase, digit, special char (`@$!%*?&`) | Yes |
| nickName | String | None (no `@NotBlank` in DTO despite being in logic) | At least not blank per service |
| avatarUrl | String | None | No |

**Purpose**: Capture registration details from frontend form.

**Expected Frontend Payload**:
```json
{
  "userId": "john_doe",
  "password": "John@123",
  "nickName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### LogReqDto
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| userId | String | min 3 chars, not blank | Yes |
| password | String | min 8 max 20, regex same as register | Yes |

**Purpose**: Capture login credentials.

### LogResDto
| Field | Type | Notes |
|-------|------|-------|
| userId | String | Logged-in user's ID |
| nickName | String | Display name |
| avatarUrl | String | Empty string if null |
| token | String | UUID token for WS connect |

**Purpose**: Return login response to frontend.

## 6.2 User DTOs

### UserResDto
| Field | Type | Notes |
|-------|------|-------|
| userId | String | User's business key |
| nickName | String | Display name |
| avatarUrl | String | Profile picture URL |
| isOnline | boolean | Whether user has active WebSocket session |

**Purpose**: Return user information (used in search, conversation summary).

### OnlinePresenceResDto
| Field | Type | Notes |
|-------|------|-------|
| id | Long | OnlinePresenceEn DB ID |
| userId | String | User ID |
| lastSeen | LocalDateTime | Last seen timestamp |

**Purpose**: Return last seen information. **Note**: This endpoint is not exposed via any controller currently.

## 6.3 Conversation DTOs

### ConversationReqDto
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| receiverId | String | min 3 chars, not null | Yes |

**Purpose**: Request to get or create a conversation with another user.

**Expected Frontend Payload**:
```json
{
  "receiverId": "jane_doe"
}
```

### ConversationDto
| Field | Type | Notes |
|-------|------|-------|
| conversationId | Long | ID of the conversation |
| user_one | String | First user (alphabetically sorted) |
| user_two | String | Second user |
| lastMessage | LocalDateTime | Timestamp of last message |

**Purpose**: Return conversation info after create/get.

### ConversationSummaryResDto
| Field | Type | Notes |
|-------|------|-------|
| conversationId | Long | Conversation ID |
| receiver | UserResDto | The OTHER user in the conversation (not the requesting user) |
| lastMessage | String | Content of the last message |
| lastMessageTime | LocalDateTime | When last message was sent |
| unreadCount | Long | Count of unread messages for this conversation |

**Purpose**: Return conversation summary list for the chat sidebar.

**Note**: The `receiver.isOnline` field is hardcoded to `true` in the current implementation (bug at `ConversationSer.java:73`).

## 6.4 Message DTOs

### MessageReqDto
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| receiver | String | min 3 chars | Yes |
| content | String | None | At least not empty (not validated) |
| sendAt | LocalDateTime | Auto-set by backend | No |

**Purpose**: Send a message via WebSocket or REST.

**Expected Frontend Payload** (WebSocket):
```json
{
  "receiver": "jane_doe",
  "content": "Hello!"
}
```

### MessageResDto
| Field | Type | Notes |
|-------|------|-------|
| conversationId | Long | Which conversation this belongs to |
| content | String | Message text |
| senderId | String | Who sent it |
| receivedAt | LocalDateTime | Timestamp (actually `sentAt` from entity) |

**Purpose**: Return message data (from REST fetch or WS broadcast).

**Note**: The field is named `receivedAt` but is mapped from `sentAt` in the entity - this is the message send time, not the delivery time.

### MarkReadReqDto
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| conversationId | Long | min value 1, not null | Yes |

**Purpose**: Mark all unread messages in a conversation as read.

### MessageReadReqDto
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| conversationId | Long | min value 1, not null | Yes |

**Purpose**: Request to load messages for a specific conversation.

---

# 7. Service Layer Flow

## 7.1 Complete Execution Flow Pattern

```
HTTP Request
    │
    ▼
Controller (@RestController)
    │  - Maps URL to method
    │  - Extracts headers, path vars, query params
    │  - Validates @Valid DTO
    │  - Calls Service
    │
    ▼
Service (@Service)
    │  - Business logic
    │  - Calls Repository methods
    │  - Validates entities exist
    │  - Maps entities to DTOs
    │
    ▼
Repository (@Repository extends JpaRepository)
    │  - Spring Data JPA generates queries
    │  - Custom @Query methods
    │
    ▼
Database (MySQL)
```

## 7.2 AuthSer

**Methods**:

### `register(RegisterReqDto)`
1. Validate DTO fields
2. Map DTO → UserEn via `LoginMapper.toUserEn()`
3. Save to DB via `UserRep.save()`
4. Return 201 with success message

### `login(LogReqDto)`
1. Validate credentials not empty
2. Find user by userId via `UserRep.findByUserId()`
3. Check user is active and not deleted
4. Map UserEn → LogResDto via `LoginMapper.logResDto()`
5. Create token via `TokenSer.createToken(userId)`
6. Set token in response DTO
7. Return 200 with LogResDto

## 7.3 TokenSer

| Method | Description | Validation |
|--------|-------------|-----------|
| `createToken(userId)` | Check user not already online, generate UUID, store in TokenRepo, return token | userId min 3 chars, not already online |
| `getUserName(token)` | Look up userId by token | Token must exist |
| `removeToken(token)` | Remove token from repo | Token must exist |
| `isTokenExists(token)` | Check if token exists | Returns false if null/blank |

## 7.4 UserSer

### `getUser(userId)`
1. Validate userId not null/blank, min 3 chars
2. Find user by `findByUserIdAndIsActiveTrueAndDeletedFalse()`
3. Check online status via `OnlinePresenceSer.isOnline()`
4. Map to `UserResDto` via `UserMapper.toUserResDto()`
5. Return user info with online status

## 7.5 ConversationSer

### `getOrCreateConversation(senderId, reqDto)`
1. Alphabetically sort: `userOne = min(senderId, receiverId)`, `userTwo = max(senderId, receiverId)`
2. Check if conversation exists via `findByUserOne_UserIdAndUserTwo_UserId()`
3. If exists → return ConversationDto
4. If not → call `createConversation()`, return ConversationDto

### `createConversation(userOne, userTwo)`
1. Validate both users exist and are active/not deleted
2. Create ConversationEn entity
3. Save to DB
4. Return saved entity

### `getUserConversations(userId, pageable)`
1. Fetch paginated conversations where user is either userOne or userTwo
2. Return raw entity Page (not ideal for frontend)

### `getConversationSummary(userId, pageable)`
1. Fetch paginated conversations
2. For each conversation:
   - Get unread count via `MessageDeliveryRepo.countUnreadMessagesByConversation()`
   - Get last message content via `MessageRepo.findByConversation_IdOrderBySentAtDesc()` (limit 1)
   - Get receiver info (the other user)
   - Build `ConversationSummaryResDto`
3. Return paginated summary DTOs

**Bug**: `convertToSummary()` fetches `userEn` by the requesting `user_id` instead of the other participant. It creates a `UserResDto` from the requesting user's own data, not the conversation partner's.

## 7.6 MessageSer

### `sendMessage(messageReqDto, senderId)`
1. Validate sender exists (active, not deleted)
2. Validate receiver exists (active, not deleted)
3. Find conversation (alphabetically sorted IDs)
4. Map DTO → MessageEn entity
5. Save message to DB
6. Create delivery record via `MessageDeliverySer.createDelivery()`
7. Map saved entity → MessageResDto
8. Return MessageResDto

### `getLatestConversationMessages(reqDto, pageable)`
1. Validate conversationId
2. Fetch paginated messages by `findByConversation_IdOrderBySentAtDesc()`
3. Map each entity → MessageResDto
4. Return paginated DTOs

## 7.7 MessageDeliverySer

### `createDelivery(messageEn)`
1. Get receiver from message
2. Validate receiver is active and not deleted
3. Create MessageDeliveryEn with status `SENT`
4. Save to DB

### `markAsRead(markReadReqDto, currUserId)`
1. Validate conversation exists
2. Validate user exists and is active
3. Execute bulk update query: all messages with conversationId + userId + status=DELIVERED → status=READ
4. Return count of updated records

### `markAsDelivered(userId)`
1. Validate user exists
2. Execute bulk update query: all messages with userId + status=SENT → status=DELIVERED
3. Return count of updated records

### `getUnreadCountsOfUser(userId)`
1. Validate user exists
2. Count all MessageDeliveryEn where user=userId AND status != READ
3. Return count

### `getUnreadCountsOfConversation(conversationId, userId)`
1. Validate conversation and user exist
2. Count unread messages for that specific conversation
3. Return count

## 7.8 ChatSer (WebSocket Router)

### `handleMessage(senderId, messageReqDto)`
1. Validate senderId
2. Get receiverId from DTO
3. Call `MessageSer.sendMessage()` to save and create delivery
4. Broadcast MessageResDto to `/queue/messages/{receiverId}`
5. **Note**: Does NOT send confirmation back to sender

## 7.9 OnlinePresenceSer

| Method | Description |
|--------|-------------|
| `isOnline(userId)` | Check if userId exists in in-memory OnlineRepo |
| `saveOnlineUser(userId, sessionId)` | Validate user exists, not already online, session not mapped; save to OnlineRepo |
| `removeOnlineUser(userId)` | Remove user from online map |
| `isSession(sessionId)` | Check if session exists |
| `getUserId(sessionId)` | Get userId from session ID |
| `getLastSeen(userId)` | Get last seen from OnlinePresenceEn (persistent) |
| `setLastFalse(userId)` | Update lastSeenAt (method name misleading - actually sets timestamp, not false) |

## 7.10 WebSocketEventListeners

**Not a service** but critical for flow.

### `handleConnect(SessionConnectEvent)`
1. Extract `token` from STOMP headers
2. Validate token exists in TokenRepo
3. Get userId from token
4. Check user not already online
5. Save user as online (OnlineRepo)
6. Put userId in session attributes
7. Mark all pending messages as DELIVERED
8. Remove token (one-time use)

### `handleDisconnect(SessionDisconnectEvent)`
1. Get sessionId from event
2. Get userId from session
3. Remove user from online users

**Missing**: Does NOT update `OnlinePresenceEn.lastSeenAt` on disconnect.

---

# 8. Chat Application Flow

## 8.1 Conversation Creation Flow

```
User A searches for User B
        │
        ▼
Frontend: GET /chat-app/v1/user/get/jane_doe
        │
        ▼
(User B found, show profile with "Start Chat" button)
        │
        ▼
Frontend: POST /chat-app/v1/conversation/create
Headers: X-Sender-Id: john_doe
Body: { "receiverId": "jane_doe" }
        │
        ▼
Backend: ConversationSer.getOrCreateConversation()
        │
        ├─ Sort alphabetically: userOne="jane_doe", userTwo="john_doe"
        │
        ├─ Check: ConversationRepo.findByUserOne_UserIdAndUserTwo_UserId(
        │          "jane_doe", "john_doe")
        │
        ├─ IF EXISTS → return ConversationDto
        │
        └─ IF NOT EXISTS →
              ├─ Validate both users exist & active
              ├─ Create ConversationEn(userOne, userTwo, lastMessageAt=now)
              └─ Return ConversationDto
        │
        ▼
Frontend Receives: { conversationId: 1, user_one: "jane_doe",
                     user_two: "john_doe", lastMessage: "..." }
        │
        ▼
Frontend: Navigate to chat view with conversationId=1
        │
        (Optionally pre-load messages)
```

## 8.2 Message Sending Flow (WebSocket)

```
Frontend: Send message via WebSocket
        │
        │ stompClient.send("/app/chat", {}, {
        │   receiver: "jane_doe",
        │   content: "Hello!"
        │ })
        │
        ▼
Backend: ChatCon.handleMessage(messageReqDto, accessor)
        │
        ├─ Extract senderId from session attributes
        │   (accessor.getSessionAttributes().get("userId"))
        │
        ▼
ChatSer.handleMessage(senderId, messageReqDto)
        │
        ▼
MessageSer.sendMessage(messageReqDto, senderId)
        │
        ├─ Validate sender exists (active, not deleted)
        ├─ Validate receiver exists (active, not deleted)
        │
        ├─ Find existing conversation:
        │   ├─ Sort alphabetically
        │   ├─ conversationRepo.findByUserOne_UserIdAndUserTwo_UserId()
        │   └─ Throw if not found
        │
        ├─ Create MessageEn:
        │   ├─ content = messageReqDto.content
        │   ├─ sender = sender UserEn
        │   ├─ receiver = receiver UserEn
        │   ├─ conversation = ConversationEn
        │   └─ Save via messageRepo.save()
        │
        ├─ Create MessageDeliveryEn:
        │   ├─ message = saved message
        │   ├─ user = receiver
        │   ├─ status = SENT
        │   └─ Save via messageDeliveryRepo.save()
        │
        └─ Map to MessageResDto:
            ├─ conversationId
            ├─ content
            ├─ senderId
            └─ receivedAt (sentAt from entity)
        │
        ▼
ChatSer: Broadcast to receiver
        │
        ├─ destination = "/queue/messages/jane_doe"
        └─ simpMessagingTemplate.convertAndSend(destination, messageResDto)
        │
        ▼
Receiver's Frontend: Subscription callback
        │
        ├─ Parse MessageResDto
        ├─ Identify conversation via conversationId
        ├─ Append message to conversation's message list
        ├─ Update conversation summary (last message)
        ├─ Update unread count if conversation not active
        └─ Update UI
```

**Note**: The sender's frontend does NOT receive the message via WebSocket. The sender should optimistically add the message to their own UI on send.

## 8.3 Message Delivery Status Flow

### Status Transition

```
SENT ──► DELIVERED ──► READ
```

### Status Change Events

**SENT → DELIVERED**:
Triggered when:
1. User establishes WebSocket connection (automatic in `handleConnect`)
2. Frontend calls `POST /messages/mark/delivered` with `X-User-Id` header

Backend query: Updates all `MessageDeliveryEn` where `userId = currentUser AND status = 'SENT'`

**DELIVERED → READ**:
Triggered when:
1. Frontend calls `POST /messages/mark/read` with body `{ conversationId }` and header `X-User-Id`

Backend query: Updates all `MessageDeliveryEn` where `userId = currentUser AND conversationId = givenId AND status = 'DELIVERED'`

**SENT → READ**: Cannot directly happen; must go through DELIVERED first.

### Entity Responsible

`MessageDeliveryEn` manages all status tracking:
- `status`: Current status enum
- `deliveredAt`: Timestamp when status changed to DELIVERED
- `readAt`: Timestamp when status changed to READ

### Frontend UI Integration

| Status | Sender Shows | Receiver Shows |
|--------|-------------|----------------|
| SENT | Single check ✓ (message sent) | Message appears as "new" |
| DELIVERED | Double check ✓✓ (message delivered) | Message appears normally |
| READ | Blue double check ✓✓ (message read) | Message appears normally (read receipts on sender side) |

Currently the backend does NOT send delivery/read updates to the sender in real-time via WebSocket. The frontend would need to:
1. Poll for status changes (not recommended)
2. Or frontend can infer: If sender sent message and no WS notification, assume SENT initially
3. After reconnecting, backend marks as DELIVERED automatically
4. Frontend can update UI accordingly

## 8.4 Message Fetching Flow

### Loading Conversations Summary

```
Frontend: Chat page loads
        │
        ▼
GET /chat-app/v1/conversation/get/conversationSummary
Header: X-User-Id: john_doe
Query: page=0, size=20
        │
        ▼
Backend: ConversationSer.getConversationSummary()
        │
        ├─ Fetch paginated conversations
        ├─ For each: fetch unread count + last message
        └─ Return paginated ConversationSummaryResDto
        │
        ▼
Frontend: Render chat sidebar
        │
        ├─ Each item: receiver info, last message preview, unread badge
        └─ Scroll → load more (page=1, 2, ...)
```

### Loading Messages for a Conversation

```
Frontend: User opens/clicks a conversation
        │
        ├─ Check if messages exist in cache for conversationId
        │
        ├─ IF NOT CACHED:
        │     │
        │     ▼
        │   POST /chat-app/v1/messages/get/latestMessages
        │   Body: { conversationId: 1 }
        │   Query: page=0, size=20, sort=sentAt,DESC
        │     │
        │     ▼
        │   Backend: MessageSer.getLatestConversationMessages()
        │     │
        │     └─ Return Page<MessageResDto> (newest first)
        │     │
        │     ▼
        │   Frontend: Cache messages, reverse array (oldest first)
        │
        ├─ IF SCROLL TO TOP (load older):
        │     │
        │     ▼
        │   POST same endpoint with page=1,2,...
        │     │
        │     └─ Prepend older messages to top of list
        │
        └─ CALL markAsRead:
              │
              ▼
            POST /chat-app/v1/messages/mark/read
            Header: X-User-Id: john_doe
            Body: { conversationId: 1 }
```

### Infinite Scroll Implementation

```
1. Page 0 = latest 20 messages (sentAt DESC)
2. Frontend: reverse array → oldest first in UI
3. When user scrolls to top:
   ├─ Increment page number
   ├─ Fetch next page (older messages)
   ├─ Prepend to message list
   └─ Maintain scroll position
4. When `last: true` in response → no more messages
```

---

# 9. Frontend Implementation Guide

## 9.1 State Management Requirements

The frontend must maintain the following state:

### Auth State
```typescript
interface AuthState {
  userId: string | null;
  token: string | null;
  nickName: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
}
```

### Conversation State
```typescript
interface ConversationSummary {
  conversationId: number;
  receiver: {
    userId: string;
    nickName: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  lastMessage: string;
  lastMessageTime: string; // ISO datetime
  unreadCount: number;
}

interface ConversationState {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  page: number;
  hasMore: boolean;
  loading: boolean;
}
```

### Messages State
```typescript
interface ChatMessage {
  conversationId: number;
  content: string;
  senderId: string;
  receivedAt: string; // ISO datetime
  status?: 'SENT' | 'DELIVERED' | 'READ'; // Local tracking
}

interface MessagesState {
  // Keyed by conversationId
  [conversationId: number]: {
    messages: ChatMessage[];
    page: number;
    hasMore: boolean;
    loading: boolean;
  };
}
```

### Real-Time State
```typescript
interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}
```

### Online Status State
```typescript
interface OnlineState {
  // Keyed by userId
  [userId: string]: boolean;
}
```

## 9.2 Optimized Frontend Behaviors

### DOs
- **Cache conversations**: Fetch once on page load, update from WS events
- **Cache messages per conversation**: Fetch once when conversation opens, append/prepend from WS
- **Use optimistic updates**: When sending a message, immediately add it to the UI
- **Batch unread counts**: Update from WS message receipt events
- **Single source of truth**: Keep one store for all state

### DON'Ts
- **Don't fetch messages on every render**: Use cache + selective updates
- **Don't fetch messages after receiving WS message**: The WS message IS the data; just update state
- **Don't create duplicate conversations**: Check if conversation exists before creating
- **Don't maintain separate state for same conversation**: One store, one source
- **Don't refetch conversations on every WS message**: Only update the summary in existing state

### Recommended Flow

```
INITIAL LOGIN:
├─ POST /auth/login → store { userId, nickName, avatarUrl, token }

CHAT PAGE LOAD:
├─ Connect WebSocket with token header
├─ GET /conversation/get/conversationSummary → populate conversations state
├─ GET /messages/get/unreadCounts → set total badge
└─ Subscribe to /queue/messages/{userId}

OPEN CONVERSATION:
├─ Set activeConversationId
├─ Check if messages[conversationId] exists in cache
├─ IF NOT → POST /messages/get/latestMessages
├─ POST /messages/mark/read (body: { conversationId })
├─ Update unreadCount to 0 for this conversation
└─ Render messages (reversed: oldest first)

SEND MESSAGE (WebSocket):
├─ Optimistically add message to UI with status 'SENT'
├─ stompClient.send("/app/chat", {}, { receiver, content })
└─ (No WS response for sender; optimistic update is final)

RECEIVE MESSAGE (WebSocket):
├─ On /queue/messages/{userId} callback
├─ Get conversationId from message
├─ Append message to messages[conversationId]
├─ Update conversation summary:
│   ├─ lastMessage = content
│   ├─ lastMessageTime = receivedAt
│   └─ unreadCount++ (if not active conversation)
└─ Render update

INFINITE SCROLL (Messages):
├─ User scrolls to top of message list
├─ POST /messages/get/latestMessages with page++
├─ Prepend older messages to top
└─ Maintain scroll position

INFINITE SCROLL (Conversations):
├─ User scrolls bottom of conversation list
├─ GET /conversation/get/conversationSummary with page++
├─ Append to conversations list
└─ Maintain scroll position
```

---

# 10. Frontend API Contract

## Complete API Reference Table

### Authentication

| # | Endpoint | Method | Request | Response | Frontend Action |
|---|----------|--------|---------|----------|-----------------|
| 1 | `/chat-app/v1/auth/register` | POST | `{ userId, password, nickName, avatarUrl? }` | `"User Created Successfully"` (String) | Registration form submit |
| 2 | `/chat-app/v1/auth/login` | POST | `{ userId, password }` | `{ userId, nickName, avatarUrl, token }` | Login form submit; store response in state/localStorage |
| 3 | `/chat-app/v1/auth/health` | GET | None | `"Server is running"` | Health check (optional) |

### Users

| # | Endpoint | Method | Request | Response | Frontend Action |
|---|----------|--------|---------|----------|-----------------|
| 4 | `/chat-app/v1/user/get/{userId}` | GET | Path: userId | `{ userId, nickName, avatarUrl, isOnline }` | Search/display user profile; get receiver info |

### Conversations

| # | Endpoint | Method | Request | Response | Frontend Action |
|---|----------|--------|---------|----------|-----------------|
| 5 | `/chat-app/v1/conversation/create` | POST | Header: `X-Sender-Id`, Body: `{ receiverId }` | `{ conversationId, user_one, user_two, lastMessage }` | Start 1-on-1 chat; get/create conversation |
| 6 | `/chat-app/v1/conversation/get` | GET | Header: `X-Sender-Id`, Query: `page, size, sort` | `Page<ConversationEn>` (raw entity) | **Rarely used**; prefer summary endpoint |
| 7 | `/chat-app/v1/conversation/get/conversationSummary` | GET | Header: `X-User-Id`, Query: `page, size, sort` | `Page<ConversationSummaryResDto>` | Chat sidebar list; each item has receiver, last message, unread count |

### Messages

| # | Endpoint | Method | Request | Response | Frontend Action |
|---|----------|--------|---------|----------|-----------------|
| 8 | `/chat-app/v1/messages/get/latestMessages` | POST | `{ conversationId }` + Query: `page, size, sort` | `Page<MessageResDto>` (newest first) | Load messages for a conversation; infinite scroll |
| 9 | `/chat-app/v1/messages/send/message/` | POST | Headers: `X-Sender-Id`, `X-Conversation-Id`, Body: `{ receiver, content }` | `"Message Sent successfully"` | Fallback send (prefer WebSocket) |
| 10 | `/chat-app/v1/messages/mark/read` | POST | Header: `X-User-Id`, Body: `{ conversationId }` | `"[N] Messages mark as read"` | Mark messages read when opening conversation |
| 11 | `/chat-app/v1/messages/mark/delivered` | POST | Header: `X-User-Id` | `"[N] Messages mark as Delivered"` | Mark messages delivered (on WS connect) |
| 12 | `/chat-app/v1/messages/get/unreadCounts` | GET | Header: `X-UserId` | Integer (e.g., `7`) | Total unread badge count |

### WebSocket

| # | Config | Value | Frontend Action |
|---|--------|-------|-----------------|
| 13 | Connection URL | `/chat-app/v1/ws` (with SockJS) | `new SockJS("http://host:port/chat-app/v1/ws")` |
| 14 | STOMP Connect | Headers: `{ token: "uuid" }` | `stompClient.connect({ token }, ...)` |
| 15 | Send Message | `/app/chat` | `stompClient.send("/app/chat", {}, { receiver, content })` |
| 16 | Receive Messages | `/queue/messages/{userId}` | `stompClient.subscribe("/queue/messages/" + userId, callback)` |

## Request/Response Examples

### Login
**Request**:
```json
POST /chat-app/v1/auth/login
Content-Type: application/json

{
  "userId": "john_doe",
  "password": "John@123"
}
```

**Response**:
```json
{
  "userId": "john_doe",
  "nickName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Get Conversation Summary
**Request**:
```http
GET /chat-app/v1/conversation/get/conversationSummary?page=0&size=20
X-User-Id: john_doe
```

**Response**:
```json
{
  "content": [
    {
      "conversationId": 1,
      "receiver": {
        "userId": "jane_doe",
        "nickName": "Jane Doe",
        "avatarUrl": "https://example.com/jane.jpg",
        "isOnline": true
      },
      "lastMessage": "Hey, how are you?",
      "lastMessageTime": "2026-06-29T12:30:00",
      "unreadCount": 2
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": { "sorted": true, "unsorted": false }
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

### Get Conversation Messages
**Request**:
```http
POST /chat-app/v1/messages/get/latestMessages?page=0&size=20&sort=sentAt,DESC
Content-Type: application/json

{
  "conversationId": 1
}
```

**Response**:
```json
{
  "content": [
    {
      "conversationId": 1,
      "content": "Hey, how are you?",
      "senderId": "jane_doe",
      "receivedAt": "2026-06-29T12:30:00"
    },
    {
      "conversationId": 1,
      "content": "I'm good, thanks!",
      "senderId": "john_doe",
      "receivedAt": "2026-06-29T12:25:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": { "sorted": true, "unsorted": false }
  },
  "totalElements": 2,
  "totalPages": 1,
  "last": true
}
```

### Create Conversation
**Request**:
```http
POST /chat-app/v1/conversation/create
X-Sender-Id: john_doe
Content-Type: application/json

{
  "receiverId": "jane_doe"
}
```

**Response**:
```json
{
  "conversationId": 1,
  "user_one": "jane_doe",
  "user_two": "john_doe",
  "lastMessage": "2026-06-29T12:30:00"
}
```

### Mark as Read
**Request**:
```http
POST /chat-app/v1/messages/mark/read
X-User-Id: john_doe
Content-Type: application/json

{
  "conversationId": 1
}
```

**Response**: `"[ 2 ] Messages mark as read"`

### Mark as Delivered
**Request**:
```http
POST /chat-app/v1/messages/mark/delivered
X-User-Id: john_doe
```

**Response**: `"[ 3 ] Messages mark as Delivered"`

### WebSocket Message (Send)
**STOMP Frame**:
```
SEND
destination: /app/chat
content-type: application/json

{
  "receiver": "jane_doe",
  "content": "Hello from John!"
}
```

### WebSocket Message (Receive)
**STOMP Frame**:
```
MESSAGE
destination: /queue/messages/john_doe
content-type: application/json

{
  "conversationId": 1,
  "content": "Hello from John!",
  "senderId": "john_doe",
  "receivedAt": "2026-06-29T12:35:00"
}
```

---

# 11. Identified Missing Features & Issues

## 11.1 Critical Security Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| No Password Hashing | **CRITICAL** | Passwords stored as plain text. Use BCrypt/Argon2. |
| No Spring Security | **HIGH** | No authentication framework. REST APIs rely on custom headers (`X-User-Id`, `X-Sender-Id`) that can be trivially spoofed. |
| In-Memory Token Storage | **HIGH** | Tokens stored in ConcurrentHashMap. Lost on server restart; not scalable across instances. |
| Token One-Time Use | **MEDIUM** | Token is deleted after WebSocket connect. If WS connection fails, user cannot retry with same token and must login again. |
| No Token Expiry | **MEDIUM** | No TTL on tokens. |
| No Rate Limiting | **MEDIUM** | No protection against brute force on login/register. |

## 11.2 Missing APIs Required by Frontend

| Missing Feature | Why Needed |
|----------------|------------|
| **Logout API** | No endpoint to invalidate session/token. User cannot explicitly log out. |
| **Search Users API** | No endpoint to search users by name/userId pattern. Frontend cannot implement user search. |
| **Update Profile API** | No endpoint to update nickName, avatarUrl. |
| **Real-Time Status Updates** | Backend does not broadcast online/offline status changes to other users via WebSocket. |
| **Typing Indicator** | No WebSocket endpoint for typing events. |
| **Delete/Edit Message API** | No support for message deletion or editing. |
| **Block User API** | No support for blocking users. |
| **Message Status WebSocket Broadcast** | Backend does not send delivery/read receipt updates to the sender via WebSocket. |

## 11.3 Bugs & Inefficiencies

| Issue | Location | Description |
|-------|----------|-------------|
| `isOnline` always `true` | `ConversationSer.java:73` | `convertToSummary()` calls `UserMapper.toUserResDto(userEn, true)` with hardcoded `true` instead of checking actual online status. |
| Wrong receiver in summary | `ConversationSer.java:72-73` | `convertToSummary()` fetches the requesting user's own data instead of the conversation partner's data for the `receiver` field. |
| Method name confusion | `OnlinePresenceSer.java` | `setLastFalse()` actually updates `lastSeenAt` timestamp, not setting anything to false. |
| Message send timestamp | `MessageMapper.java:25` | Field in `MessageResDto` is named `receivedAt` but maps from `messageEn.getSentAt()`. |
| No `@Transactional` on some critical operations | `ConversationSer.getOrCreateConversation()` | Not annotated with `@Transactional`, potential race condition. |
| User not removed from online on disconnect `lastSeenAt` | `WebSocketEventListeners.handleDisconnect()` | Does not update persistent `OnlinePresenceEn.lastSeenAt` when user disconnects. |

## 11.4 Scalability Problems

| Problem | Description |
|---------|-------------|
| In-Memory State | `TokenRepo` and `OnlineRepo` use `ConcurrentHashMap` - not distributed, lost on restart, not suitable for multiple instances. |
| No Pagination on Unread Count API | `GET /messages/get/unreadCounts` returns total across all conversations - can be slow for many conversations. |
| N+1 Query Pattern | `getConversationSummary()` makes separate queries (unread count + last message) for EACH conversation in the list. |
| No Message Search | No endpoint to search through message history. |
| No File/Image Upload | No support for sending images, files, or attachments. |

## 11.5 Chat Application Improvements

| Improvement | Benefit |
|-------------|---------|
| WebSocket delivery/read receipts | Sender should receive real-time updates when messages are delivered/read. |
| Typing indicator WebSocket endpoint | `/app/typing` or similar to broadcast typing status. |
| Online/offline broadcast | Broadcast to all conversation partners when a user comes online/goes offline. |
| Group chat support | Currently only 1-to-1 conversations. |
| Message reactions | No support for emoji reactions. |
| Push notifications | No mobile/web push notification support. |
| Message encryption | No end-to-end encryption. |
| Message edit history | No edit tracking. |

---

# 12. Technology Stack Summary for Frontend Developer

## Backend Details

| Detail | Value |
|--------|-------|
| Base URL | `http://localhost:8080/chat-app/v1` |
| WebSocket URL | `http://localhost:8080/chat-app/v1/ws` (SockJS) |
| Auth Method | Custom header-based for REST, token header for WS |
| Token Type | UUID (string) |
| Pagination | Spring Data Pageable (`page`, `size`, `sort`) |
| Date Format | ISO 8601 (`LocalDateTime`: `2026-06-29T12:00:00`) |
| CORS | Only `http://localhost:5173` allowed; production CORS must be updated |

## Quick Reference: Headers Used

| Header | Used In | Value |
|--------|---------|-------|
| `X-Sender-Id` | Conversation create, Message send | Current user's userId |
| `X-User-Id` | Conversation summary, Mark read, Mark delivered, Unread counts | Current user's userId |
| `X-UserId` | Unread counts (alternative name) | Current user's userId |
| `X-Conversation-Id` | REST message send | conversationId number |

## Quick Reference: Default Pagination Values

| Endpoint | Default Page | Default Size | Default Sort |
|----------|-------------|-------------|--------------|
| `GET /conversation/get` | 0 | 20 | `lastMessageAt, DESC` |
| `GET /conversation/get/conversationSummary` | 0 | 20 | `lastMessageAt, DESC` |
| `POST /messages/get/latestMessages` | 0 | 20 | `sentAt, DESC` |
