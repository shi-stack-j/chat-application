package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.dto.message.MessageNotificationInfoDto;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface MessageDeliveryRepo extends JpaRepository<MessageDeliveryEn,Long> {
//    This repo method is used to return the sender id and the conversation ids
//    Of those who have sent the messages but not reached to us in sent status
//    Simply means in which it is receiver those messages will reach to this user
    @Query("""
        SELECT DISTINCT md.message.sender.userId, md.message.conversation.id
        FROM MessageDeliveryEn md
        WHERE md.user.userId = :userId
        AND md.status = 'SENT'
        AND md.status <> 'BLOCKED'
    """)
    List<Object[]> findPendingSendersAndConversations(
            @Param("userId") String userId
    );
//    This repo method is used to mark those messages as delivered who`s status is sent only
    @Modifying
    @Query("""
        UPDATE MessageDeliveryEn md
        SET md.status = 'DELIVERED',
            md.deliveredAt = CURRENT_TIMESTAMP
        WHERE md.user.userId = :userId
        AND md.status = 'SENT'
        AND md.status <> 'BLOCKED'
    """)
    int markPendingMessagesDelivered(
            @Param("userId") String userId
    );

    @Modifying
    @Query("""
        UPDATE MessageDeliveryEn md
        SET md.status = 'READ',
            md.readAt = CURRENT_TIMESTAMP
        WHERE md.user.userId = :userId
        AND md.message.conversation.id = :conversationId
        AND md.status = 'DELIVERED'
        AND md.status <> 'BLOCKED'
    """)
    int markConversationMessagesAsRead(
            @Param("userId") String userId,
            @Param("conversationId") Long conversationId
    );

    @Query("""
            SELECT COUNT(md)
            FROM MessageDeliveryEn md
            WHERE
                    md.message.receiver.userId = :userId
                AND 
                    md.message.conversation.id = :conversationId
                AND 
                    md.status <> com.shiv.chat_bakend.enums.MessageStatusEnum.READ
                AND
                    md.status <> com.shiv.chat_bakend.enums.MessageStatusEnum.BLOCKED
                AND
                (
                    :clearedAt IS NULL
                    OR
                    md.message.sentAt > :clearedAt
                )
            
     """)
    long countUnreadMessagesByConversation(
            @Param("userId") String userId,
            @Param("conversationId") Long conversationId,
            @Param("clearedAt")LocalDateTime clearedAt
    );
    @Query("""
        SELECT COUNT(md)
        FROM MessageDeliveryEn md
        WHERE md.user.userId = :userId
        AND md.status <> 'READ'
        AND md.status <> 'BLOCKED'
    """)
    long countUnreadMessages(
            @Param("userId") String userId
    );
    @Query("""
        SELECT new com.shiv.chat_bakend.dto.message.MessageNotificationInfoDto(
            mde.message.sender.userId,
            mde.message.conversation.id
        )
        FROM MessageDeliveryEn mde 
        WHERE 
            mde.message.id = :messageId
            AND
            mde.user.userId = :receiverId     
    """)
    Optional<MessageNotificationInfoDto> findMessageInfo(
            @Param("messageId") Long messageId,
            @Param("receiverId") String receiverId
    );

    @Query("""
        SELECT mde.message.sender.userId
        FROM MessageDeliveryEn mde
        WHERE
            mde.user.userId = :receiverId
            AND
            mde.message.conversation.id = :conversationId
    """)
    Optional<String> findSenderForRead(
            @Param("receiverId")String receiverId,
            @Param("conversationId")Long conversationId
    );

    @Query("""
            SELECT COUNT(md)
            FROM MessageDeliveryEn md
            WHERE
                    md.message.receiver.userId = :userId
                AND 
                    md.message.conversation.id = :conversationId
                AND 
                    md.status <> com.shiv.chat_bakend.enums.MessageStatusEnum.READ
                AND 
                    md.status <> com.shiv.chat_bakend.enums.MessageStatusEnum.BLOCKED
                AND
                    md.message.id NOT IN :deletedMessageIds
                AND
                (
                    :clearedAt IS NULL
                    OR
                    md.message.sentAt > :clearedAt
                )
                
            
     """)
    long countUnreadMessagesByConversationWithDeletedMessages(
            @Param("userId") String userId,
            @Param("conversationId") Long conversationId,
            @Param("clearedAt")LocalDateTime clearedAt,
            @Param("deletedMessageIds") Set<Long> deletedMessageIds
    );

    List<MessageDeliveryEn> findByMessage_IdIn(Set<Long> messageIds);
}
