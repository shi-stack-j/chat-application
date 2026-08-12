package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.MessageEn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface MessageRepo extends JpaRepository<MessageEn,Long> {

    Page<MessageEn> findByConversation_IdOrderBySentAtDesc(Long conversationId,Pageable pageable);

    @Query("""
        SELECT m
        FROM MessageEn m
        JOIN MessageDeliveryEn mde
            ON m.id = mde.message.id
        WHERE
            m.conversation.id = :conversationId
            AND 
                (
                    :clearedAt IS NULL
                    OR 
                    m.sentAt > :clearedAt
                )
            AND 
                m.id NOT IN :deletedMessageIds
            AND
                (
                    mde.status <> com.shiv.chat_bakend.enums.MessageStatusEnum.BLOCKED
                    OR
                    m.sender.userId = :userId
                )
        ORDER BY m.sentAt DESC
    """)
    Page<MessageEn> findMessagesOfConversationWithDeleted(
            @Param("conversationId")Long conversationId,
            @Param("clearedAt") LocalDateTime clearedAt,
            @Param("deletedMessageIds")Set<Long> deletedMessageIds,
            @Param("userId")String userId,
            Pageable pageable
    );


    @Query("""
        SELECT m
        FROM MessageEn m
        WHERE
            m.id = :messageId
            AND
            m.sender.userId = :userId
    """)
    Optional<MessageEn> findAuthorizedMessageForSender(
            @Param("userId") String userId,
            @Param("messageId") Long messageId
    );

    @Query("""
        SELECT m.id
        FROM MessageEn m
        WHERE
            m.id IN :messageIds
            AND
            (
                m.sender.userId = :userId
                OR
                m.receiver.userId = :userId
            )
    """)
    Set<Long> findAuthorizedMessageIds(
            @Param("messageIds")Set<Long> messageIds,
            @Param("userId") String userId
    );

    @Query("""
        SELECT m
        FROM MessageEn m
        WHERE
            m.id IN :messageIds
            AND (
                m.sender.userId = :userId
                OR
                m.receiver.userId = :userId
            )
    """)
    List<MessageEn> findAuthorizedMessages(
            @Param("userId") String userId,
            @Param("messageIds")Set<Long> messageIds
    );

    @Query("""
        SELECT m
        FROM MessageEn m
        JOIN MessageDeliveryEn mde
            ON mde.message.id = m.id
        WHERE
            m.conversation.id = :conversationId
            AND
                (
                    :clearedAt IS NULL
                    OR
                    m.sentAt > :clearedAt
                )
            AND 
                (
                    mde.status <> com.shiv.chat_bakend.enums.MessageStatusEnum.BLOCKED
                    OR
                    m.sender.userId = :userId 
                )
        ORDER BY m.sentAt DESC
    """)
    Page<MessageEn> findMessagesOfConversation(
            @Param("conversationId")Long conversationId,
            @Param("clearedAt") LocalDateTime clearedAt,
            @Param("userId") String userId,
            Pageable pageable
    );

}
