# Entities and their Fields

## ConversationEn
- ConversationEn.id: Long
- ConversationEn.userOne: UserEn
- ConversationEn.userTwo: UserEn
- ConversationEn.createdAt: LocalDateTime
- ConversationEn.updatedAt: LocalDateTime
- ConversationEn.active: boolean
- ConversationEn.lastMessageAt: LocalDateTime

## MessageDeliveryEn
- MessageDeliveryEn.id: Long
- MessageDeliveryEn.message: MessageEn
- MessageDeliveryEn.user: UserEn
- MessageDeliveryEn.status: MessageStatusEnum
- MessageDeliveryEn.deliveredAt: LocalDateTime
- MessageDeliveryEn.readAt: LocalDateTime

## MessageEn
- MessageEn.id: Long
- MessageEn.conversation: ConversationEn
- MessageEn.sender: UserEn
- MessageEn.receiver: UserEn
- MessageEn.content: String
- MessageEn.sentAt: LocalDateTime
- MessageEn.createdAt: LocalDateTime

## OnlinePresenceEn
- OnlinePresenceEn.id: Long
- OnlinePresenceEn.user: UserEn
- OnlinePresenceEn.lastSeenAt: LocalDateTime

## OnlineUserSession
- OnlineUserSession.userId: String
- OnlineUserSession.sessionId: String

## UserEn
- UserEn.id: Long
- UserEn.userId: String
- UserEn.nickName: String
- UserEn.password: String
- UserEn.avatarUrl: String
- UserEn.isActive: boolean
- UserEn.deleted: boolean
- UserEn.createdAt: LocalDateTime
- UserEn.updatedAt: LocalDateTime
- UserEn.deactivatedOn: LocalDateTime
- UserEn.deletedOn: LocalDateTime
