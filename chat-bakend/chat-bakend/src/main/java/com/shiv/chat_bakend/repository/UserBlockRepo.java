package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.UserBlockEn;
import com.shiv.chat_bakend.projection.UserBlockProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.JpqlQueryBuilder;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface UserBlockRepo extends JpaRepository<UserBlockEn,Long> {

    boolean existsByBlocker_UserIdAndBlocked_UserId(String blockerId,String blockedId);

    @Query("""
        SELECT ub
        FROM UserBlockEn ub 
        WHERE 
            ub.blocked.userId = :blockedUserId
            AND 
            ub.blocker.userId = :blockerUserId
    """)
    Optional<UserBlockEn> findUserBlocked(
            @Param("blockedUserId")String blockedUserId,
            @Param("blockerUserId")String blockerUserId
    );

    @Query("""
        SELECT COUNT(ube) > 0
        FROM UserBlockEn ube
        WHERE 
            (
                ube.blocker.userId = :senderId
                AND
                ube.blocked.userId = :receiverId
            )
            OR
            (
                ube.blocker.userId = :receiverId
                AND 
                ube.blocked.userId = :senderId
            )
    """)
    boolean isCommunicationBlocked(
            @Param("senderId")String senderId,
            @Param("receiverId")String receiverId
    );

    @Query("""
        SELECT
            CASE
                WHEN ub.blocker.userId = :userId
                THEN ub.blocked.userId
                ELSE ub.blocker.userId
            END
        FROM UserBlockEn ub
        WHERE
            ub.blocker.userId = :userId
            OR
            ub.blocked.userId = :userId
    """)
    Set<String> findBlockedUsers(
            @Param("userId") String userId
    );

    @Query("""
    SELECT
        CASE WHEN COUNT(ub) > 0 THEN true ELSE false END AS anyBlock,
        CASE
            WHEN COUNT(
                CASE
                    WHEN ub.blocker.userId = :currentUserId
                     AND ub.blocked.userId = :otherUserId
                    THEN 1
                END
            ) > 0
            THEN true
            ELSE false
        END AS currentUserBlocker
    FROM UserBlockEn ub
    WHERE
        (
            ub.blocker.userId = :currentUserId
            AND ub.blocked.userId = :otherUserId
        )
        OR
        (
            ub.blocker.userId = :otherUserId
            AND ub.blocked.userId = :currentUserId
        )
    """)
    UserBlockProjection findBlockInfoBetweenUsers(
            @Param("currentUserId") String currentUserId,
            @Param("otherUserId") String otherUserId
    );
}
