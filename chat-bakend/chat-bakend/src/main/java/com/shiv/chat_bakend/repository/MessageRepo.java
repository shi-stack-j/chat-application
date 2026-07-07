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

    Page<MessageEn> findByConversation_IdOrderBySentAtDesc(Long conversationId,Pageable pageable);

}
