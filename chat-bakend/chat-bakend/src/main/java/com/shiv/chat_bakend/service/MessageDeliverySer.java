package com.shiv.chat_bakend.service;


import com.shiv.chat_bakend.dto.message.MarkReadReqDto;
import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.mapper.MessageDeliveryMapper;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.MessageDeliveryRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class MessageDeliverySer {
    @Autowired
    private MessageDeliveryRepo messageDeliveryRepo;
    @Autowired
    private UserRep userRep;
    @Autowired
    private ConversationRepo conversationRepo;

//    This method is used to create the delivery for the existing method
    public ResponseEntity<?> createDelivery(MessageEn messageEn){
        if(messageEn==null )return ResponseEntity.badRequest().body("Message request is not valid");
        UserEn receiver=messageEn.getReceiver();
        if(receiver==null || receiver.isDeleted() || !receiver.isActive()) {
            return ResponseEntity.badRequest().body("Receiver Not found");
        }
        MessageDeliveryEn messageDeliveryEn= MessageDeliveryMapper.toMessageDeliveryEn(messageEn);
        messageDeliveryRepo.save(messageDeliveryEn);
        return ResponseEntity.ok("Message Delivery Created");
    }
//    This method is used to mark  the message as Read
    @Transactional
    public ResponseEntity<?> markAsRead(MarkReadReqDto markReadReqDto, String currUserId){
        if(markReadReqDto==null  || currUserId==null || currUserId.isBlank()){
            return ResponseEntity.badRequest().body("Conversation or userID is not valid");
        }
        boolean conversationExists=conversationRepo.existsById(markReadReqDto.getConversationId());
        boolean userExists=userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(currUserId);
        if(!conversationExists || !userExists )return ResponseEntity.badRequest().body("Conversation or User not found");
        int count= messageDeliveryRepo.markConversationMessagesAsRead(currUserId,markReadReqDto.getConversationId());
        return ResponseEntity.ok("[ "+count+" ] Messages mark as read");
    }
//    This method is used to mark the message as delivered
    @Transactional
    public ResponseEntity<?> markAsDelivered(String userId){
        if(userId==null || userId.isBlank()){
            return ResponseEntity.badRequest().body("userID is not valid");
        }
        boolean userExists=userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(userId);
        if(!userExists )return ResponseEntity.badRequest().body("User not found");
        int count= messageDeliveryRepo.markPendingMessagesDelivered(userId);
        return ResponseEntity.ok("[ "+count+" ] Messages mark as Delivered");
    }
//    This method is used to return the cont of the unread messages of the user
    public ResponseEntity<?> getUnreadCountsOfUser(String userId){
        if(userId==null || userId.isBlank()){
            return ResponseEntity.badRequest().body("userID is not valid");
        }
        boolean userExists=userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(userId);
        if(!userExists )return ResponseEntity.badRequest().body("User not found");
        Long count= messageDeliveryRepo.countUnreadMessages(userId);
        return ResponseEntity.ok(count);
    }
//    This method is used to return the count of the unread messages of the conversation
    public ResponseEntity<?> getUnreadCountsOfConversation(Long conversationId,String userId){
        if(conversationId==null || conversationId<=0 || userId==null || userId.isBlank()){
            return ResponseEntity.badRequest().body("Conversation or userID is not valid");
        }
        boolean conversationExists=conversationRepo.existsById(conversationId);
        boolean userExists=userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(userId);
        if(!conversationExists || !userExists )return ResponseEntity.badRequest().body("Conversation or User not found");
        Long count=messageDeliveryRepo.countUnreadMessagesByConversation(userId,conversationId);
        return ResponseEntity.ok(count);
    }
}
