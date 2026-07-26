package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.dto.message.MessageNotificationInfoDto;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageDeliveryRepo extends JpaRepository<MessageDeliveryEn,Long> {
    @Query("""
        SELECT DISTINCT md.message.sender.userId, md.message.conversation.id
        FROM MessageDeliveryEn md
        WHERE md.user.userId = :userId
        AND md.status = 'SENT'
    """)
    List<Object[]> findPendingSendersAndConversations(
            @Param("userId") String userId
    );

    @Modifying
    @Query("""
        UPDATE MessageDeliveryEn md
        SET md.status = 'DELIVERED',
            md.deliveredAt = CURRENT_TIMESTAMP
        WHERE md.user.userId = :userId
        AND md.status = 'SENT'
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
    """)
    int markConversationMessagesAsRead(
            @Param("userId") String userId,
            @Param("conversationId") Long conversationId
    );

    @Query("""
            SELECT COUNT(md)
            FROM MessageDeliveryEn md
            WHERE md.message.receiver.userId = :userId
            AND md.message.conversation.id = :conversationId
            AND md.status <> "READ"
     """)
    long countUnreadMessagesByConversation(
            @Param("userId") String userId,
            @Param("conversationId") Long conversationId
    );
    @Query("""
        SELECT COUNT(md)
        FROM MessageDeliveryEn md
        WHERE md.user.userId = :userId
        AND md.status <> 'READ'
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

}
