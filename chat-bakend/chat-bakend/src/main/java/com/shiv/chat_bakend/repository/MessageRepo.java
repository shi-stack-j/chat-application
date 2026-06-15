package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.UserEn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepo extends JpaRepository<MessageEn,Long> {
//    This method is used to fetch the messages of the conversation
    Page<MessageEn> findByConversationOrderBySentAtAsc(ConversationEn conversation,Pageable pageable);
//    This method is used to fetch the Messages of the receiver by status
    List<MessageEn> findByReceiverAndStatus(UserEn receiver,MessageStatusEnum status);
//
    Page<MessageEn> findByConversationOrderBySentAtDesc(ConversationEn conversation, Pageable pageable);
//    This method is used to update the status of the message
    @Modifying
    @Query("""
        UPDATE MessageEn m
        SET m.status='DELIVERED',
        m.deliveredAt=:time
        WHERE m.id=:id
    """)
    void markDelivered(Long id, LocalDateTime time);

//    This is used to fetch the count of the messages of the receiver
    long countByReceiverAndStatus(UserEn receiver, MessageStatusEnum status);
}
