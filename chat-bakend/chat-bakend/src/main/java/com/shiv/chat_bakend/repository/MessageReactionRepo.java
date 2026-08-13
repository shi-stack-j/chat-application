package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.MessageReactionEn;
import com.shiv.chat_bakend.projection.MessageReactionProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepo extends JpaRepository<MessageReactionEn,Long> {

    Optional<MessageReactionEn> findByMessageEn_IdAndUser_UserId(Long messageId,String userId);

    @Query("""
        SELECT
            mr.messageEn.id AS messageId,
            mr.user.userId AS userId,
            mr.emoji AS emoji
        FROM MessageReactionEn mr
        WHERE mr.messageEn.id IN :messageIds
    """)
    List<MessageReactionProjection> findReactionsByMessageIds(
            @Param("messageIds") List<Long> messageIds
    );
}
