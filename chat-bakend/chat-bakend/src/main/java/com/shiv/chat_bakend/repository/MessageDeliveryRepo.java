package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageDeliveryRepo extends JpaRepository<MessageDeliveryEn,Long> {
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


}
