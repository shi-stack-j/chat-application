package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.UserEn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepo extends JpaRepository<ConversationEn , Long> {
//    This method is used to fetch the Conversation by userId's
    Optional<ConversationEn> findByUserOne_UserIdAndUserTwo_UserId(String userOne ,String userTwo);
//    This method is used to fetch the user Conversations by userId
    @Query("""
            SELECT c FROM ConversationEn c
            WHERE c.userOne.userId=:user
            OR c.userTwo.userId=:user
            ORDER BY c.updatedAt DESC
    """)
    Page<ConversationEn> findUserConversations(@Param("user") String user, Pageable pageable);

//    To check that conversation exists or not
    boolean existsByUserOne_UserIdAndUserTwo_UserId(String userOne , String userTwo);

    @Query("""
        SELECT c
        FROM ConversationEn c
        JOIN FETCH c.userOne
        JOIN FETCH c.userTwo
        WHERE c.userOne.userId = :user
           OR c.userTwo.userId = :user
        ORDER BY c.updatedAt DESC
    """)
    List<ConversationEn> findAllConversations(@Param("user") String user);

}
