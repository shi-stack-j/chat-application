package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.MessageDeleteReqDto;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.MessageVisibilityEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.MessageDeliveryRepo;
import com.shiv.chat_bakend.repository.MessageRepo;
import com.shiv.chat_bakend.repository.MessageVisibilityRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MessageVisibilitySer {
    @Autowired
    private MessageDeliveryRepo messageDeliveryRepo;
    @Autowired
    private CurrentUserSer currentUserSer;
    @Autowired
    private MessageRepo messageRepo;
    @Autowired
    private UserRep userRep;
    @Autowired
    private MessageVisibilityRepo messageVisibilityRepo;
//    Delete from my side
    @Transactional
    public ResponseEntity<?> deleteFromMySide(MessageDeleteReqDto deleteReqDto){
        if(deleteReqDto==null )return ResponseEntity.badRequest().body("Request Dto cannot be null");
        String userId=currentUserSer.getUserId();
        Set<Long>cleanedIds=cleanTheIds(deleteReqDto.getDeleteMessageIds(),userId);
        if(cleanedIds.isEmpty())return ResponseEntity.ok("Deleted Successfully ");
        UserEn userEn=userRep.findByUserId(userId).orElseThrow(
                ()->new RuntimeException("User not authenticated")
        );
        List<MessageEn> messageEns=messageRepo.findAuthorizedMessages(userId,cleanedIds);
        LocalDateTime currentTime=LocalDateTime.now();
        List<MessageVisibilityEn> messageVisibilityEns= messageEns.stream()
                .map((msg)->
                        MessageVisibilityEn.builder()
                                .message(msg)
                                .user(userEn)
                                .deletedAt(currentTime)
                                .build()
                ).collect(Collectors.toList());
        messageVisibilityRepo.saveAll(messageVisibilityEns);
        return ResponseEntity.ok("Message Deleted Successfully");
    }
//    This method is used to remove the unauthorized ids and already deleted message ids
    private Set<Long> cleanTheIds(Set<Long> messageIds,String userId){
        Set<Long> authorizedMessageIds=messageRepo.findAuthorizedMessageIds(messageIds,userId);
        if(authorizedMessageIds.isEmpty())return authorizedMessageIds;
        Set<Long> alreadyDeletedIds=messageVisibilityRepo.findAlreadyDeletedMessageIds(userId,authorizedMessageIds);
        if(alreadyDeletedIds.isEmpty())return authorizedMessageIds;
        authorizedMessageIds.removeAll(alreadyDeletedIds);
        return authorizedMessageIds;
    }
}
