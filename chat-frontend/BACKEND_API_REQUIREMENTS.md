# Backend API Requirements Specification

This document defines the complete backend integration contract required by the React chat frontend. It describes all HTTP REST APIs and WebSocket communication protocols.

---

## 1. REST APIs

### API 1: Verify User ID (Login)
- **API Name**: Verify User ID
- **Purpose**: Sent during the initial login step. Verifies whether a given User ID is valid, allowed, and not suspended/taken.
- **Method**: POST
- **Endpoint**: `/api/users/verify`

#### Request:
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "userId": "string"
  }
  ```
- **Required Fields**:
  - `userId` (string, required): The unique alphanumeric identifier chosen by the user.

#### Expected Success Response:
- **HTTP Status**: `200 OK`
- **Body**:
  ```json
  {
    "success": "boolean",
    "userId": "string",
    "nickname": "string",
    "avatarUrl": "string"
  }
  ```
- **Data Types**:
  - `success` (boolean): `true` if the verification succeeded.
  - `userId` (string): The verified unique user identifier.
  - `nickname` (string): The display name associated with this user (defaults to `userId`).
  - `avatarUrl` (string): The URL of the avatar image generated or associated with the user ID.

#### Failure Response:
- **HTTP Status**: `400 Bad Request` or `403 Forbidden`
- **Body**:
  ```json
  {
    "errorCode": "string",
    "message": "string"
  }
  ```
- **Data Types**:
  - `errorCode` (string): The error category code (e.g. `USER_BLOCKED`, `INVALID_CHARACTERS`, `ALREADY_ACTIVE`).
  - `message` (string): A human-readable description of why the login failed, which will be shown to the user.

---

### API 2: Connect User (Search / Connect Peer)
- **API Name**: Connect User
- **Purpose**: Dispatched from the dashboard when the user searches for another user's unique ID and clicks "Connect". Checks if that user exists, is online, and if a session can be created.
- **Method**: POST
- **Endpoint**: `/api/users/connect`

#### Request:
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "userId": "string",
    "targetId": "string"
  }
  ```
- **Required Fields**:
  - `userId` (string, required): The current logged-in user ID initiating the connection.
  - `targetId` (string, required): The target user ID being searched.

#### Expected Success Response:
- **HTTP Status**: `200 OK`
- **Body**:
  ```json
  {
    "success": "boolean",
    "user": {
      "userId": "string",
      "nickname": "string",
      "avatarUrl": "string",
      "status": "string"
    }
  }
  ```
- **Data Types**:
  - `success` (boolean): `true` indicating the target exists and is ready for chat.
  - `user.userId` (string): The unique user ID of the connected peer.
  - `user.nickname` (string): The display nickname of the connected peer.
  - `user.avatarUrl` (string): The avatar image URL of the connected peer.
  - `user.status` (string): The status of the user, expected to be `online`.

#### Failure Response:
- **HTTP Status**: `404 Not Found` or `400 Bad Request`
- **Body**:
  ```json
  {
    "errorCode": "string",
    "message": "string"
  }
  ```
- **Data Types**:
  - `errorCode` (string): Error code (e.g., `USER_NOT_FOUND`, `USER_OFFLINE`, `SELF_CONNECT_NOT_ALLOWED`).
  - `message` (string): Human-readable notification description (e.g. "User is offline. Communication cannot be established.").

---

## 2. Real-Time STOMP WebSockets

Since **no chat history is stored or persisted on the backend database**, all chat message logging is handled locally in-memory by the frontend client (under the React `ChatContext` state). The backend is solely responsible for routing real-time chat messages between online users using WebSockets.

### Connection Handshake
- **Protocol**: WebSocket / SockJS fallback
- **Connection URL**: `ws://<host>:<port>/ws-chat`

---

### Frame 1: Outbound Messages (Sending a message)
- **Purpose**: Dispatched by the frontend when a user types a message and clicks Send.
- **Destination**: `/app/chat.send`
- **STOMP Command**: `SEND`

#### Request Body Structure:
```json
{
  "id": "string",
  "senderId": "string",
  "receiverId": "string",
  "content": "string",
  "timestamp": "string"
}
```
- **Fields & Types**:
  - `id` (string, required): A unique client-generated message ID (prevents duplicates).
  - `senderId` (string, required): The User ID of the sender.
  - `receiverId` (string, required): The User ID of the recipient.
  - `content` (string, required): The text content of the message.
  - `timestamp` (string, required): The ISO 8601 formatted timestamp when the message was sent (e.g., `2026-06-13T12:00:00.000Z`).

---

### Frame 2: Inbound Messages (Receiving a message)
- **Purpose**: Dispatched by the backend to push new messages to the destination user.
- **Subscription Destination**: `/user/queue/messages`
- **STOMP Command**: `MESSAGE`

#### Response Body Structure:
```json
{
  "id": "string",
  "senderId": "string",
  "receiverId": "string",
  "content": "string",
  "timestamp": "string"
}
```
- **Fields & Types**:
  - `id` (string): Unique message ID.
  - `senderId` (string): User ID of the sender.
  - `receiverId` (string): User ID of the recipient (the logged-in user).
  - `content` (string): The text content.
  - `timestamp` (string): ISO 8601 timestamp.

---

### Frame 3: Typing Status Indicator (Optional integration)
- **Purpose**: Real-time broadcast when a peer is actively typing in a chat window.
- **Destination**: `/app/chat.typing`
- **Subscription**: `/user/queue/typing`
- **Body**:
  ```json
  {
    "senderId": "string",
    "receiverId": "string",
    "isTyping": "boolean"
  }
  ```
- **Fields & Types**:
  - `senderId` (string): The user who is typing.
  - `receiverId` (string): The user who should receive the typing alert.
  - `isTyping` (boolean): `true` if typing, `false` if stopped typing.
