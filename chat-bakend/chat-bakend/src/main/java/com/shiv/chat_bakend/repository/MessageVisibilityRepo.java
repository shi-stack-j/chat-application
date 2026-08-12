package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.MessageVisibilityEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

@Repository
public interface MessageVisibilityRepo extends JpaRepository<MessageVisibilityEn,Long> {

    @Query("""
    SELECT mv.message.id
    FROM MessageVisibilityEn mv
    WHERE
        mv.user.userId = :userId
    AND
        mv.message.id IN :messageIds
    """)
    Set<Long> findAlreadyDeletedMessageIds(
            @Param("userId") String userId,
            @Param("messageIds") Set<Long> messageIds
    );

    @Query("""
    SELECT mv.message.id
    FROM MessageVisibilityEn mv
    WHERE
        mv.user.userId = :userId
    AND
        mv.message.conversation.id = :conversationId
    AND 
        (
            :clearedAt IS NULL
            OR 
            mv.deletedAt > :clearedAt
        )
    """)
    Set<Long> findDeletedMessageIds(
            @Param("userId") String userId,
            @Param("conversationId") Long conversationId,
            @Param("clearedAt")LocalDateTime clearedAt
    );

    @Query("""
    SELECT CASE
        WHEN COUNT(mv) > 0 THEN true
        ELSE false
    END
    FROM MessageVisibilityEn mv
    WHERE
            mv.message.id = :messageId
        AND
            mv.user.userId = :userId
    """)
    boolean checkIsDeleted(
            @Param("userId")String userId,
            @Param("messageId")Long messageId
    );
}
