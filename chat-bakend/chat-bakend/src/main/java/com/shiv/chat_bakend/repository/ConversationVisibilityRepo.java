package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.ConversationVisibilityEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;


@Repository
public interface ConversationVisibilityRepo extends JpaRepository<ConversationVisibilityEn,Long> {

    @Query("""
        SELECT c
        FROM ConversationVisibilityEn c
        WHERE
            c.conversation.id = :conversationId
            AND
            c.user.userId = :userId
    """)
    Optional<ConversationVisibilityEn> findClearConversation(
            @Param("conversationId") Long conversationId,
            @Param("userId") String userId
    );

    @Query("""
        SELECT CASE
            WHEN  ( cv.clearedAt > :messageDate ) THEN true
            ELSE false
            END
        FROM ConversationVisibilityEn cv
        WHERE 
            cv.conversation.id = :conversationId
            AND 
            cv.user.userId = :userId
    """)
    Optional<Boolean> checkIsMessageCleared(
            @Param("conversationId")Long conversationId,
            @Param("userId")String userId,
            @Param("messageDate")LocalDateTime messageDate
    );
}
