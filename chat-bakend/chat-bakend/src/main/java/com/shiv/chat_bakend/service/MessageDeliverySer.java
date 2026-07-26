package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.message.MarkReadReqDto;
import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.mapper.MessageDeliveryMapper;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.MessageDeliveryEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.MessageDeliveryRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MessageDeliverySer {
    @Autowired
    private MessageDeliveryRepo messageDeliveryRepo;
    @Autowired
    private UserRep userRep;
    @Autowired
    private ConversationRepo conversationRepo;
    @Autowired
    private CurrentUserSer currentUserSer;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    @Autowired
    private NotificationServ notificationServ;

//    This method is used to create the delivery for the existing method
    public ResponseEntity<?> createDelivery(MessageEn messageEn){
        if(messageEn==null )return ResponseEntity.badRequest().body("Message request is not valid");
        UserEn receiver=messageEn.getReceiver();
        if(receiver==null || receiver.isDeleted() || !receiver.isActive()) {
            return ResponseEntity.badRequest().body("Receiver Not found");
        }

        boolean isReceiverOnline = onlinePresenceSer.isOnline(receiver.getUserId());
        MessageStatusEnum status = isReceiverOnline ? MessageStatusEnum.DELIVERED : MessageStatusEnum.SENT;
        MessageDeliveryEn messageDeliveryEn= MessageDeliveryMapper.toMessageDeliveryEn(messageEn, status);
        if (isReceiverOnline) {
            messageDeliveryEn.setDeliveredAt(java.time.LocalDateTime.now());
        }
        messageDeliveryRepo.save(messageDeliveryEn);
        if (isReceiverOnline) {
            notificationServ.notifyDelivery(messageEn.getSender().getUserId(), messageEn.getConversation().getId());
        }
        return ResponseEntity.ok("Message Delivery Created");
    }
//    This method is used to mark  the message as Read
    @Transactional
    public ResponseEntity<?> markAsRead(MarkReadReqDto markReadReqDto){
        System.out.println("Calling the message mark read service.......");
        String currUserId=currentUserSer.getUserId();
        if(markReadReqDto==null  || currUserId==null || currUserId.isBlank()){
            return ResponseEntity.badRequest().body("Conversation or userID is not valid");
        }
        boolean isExists=conversationRepo.existsConversationForUser(markReadReqDto.getConversationId(),currUserId);
        if(!isExists)throw new RuntimeException("Conversation id is not valid or Not Authorized");
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
        java.util.List<Object[]> pending = messageDeliveryRepo.findPendingSendersAndConversations(userId);
        int count= messageDeliveryRepo.markPendingMessagesDelivered(userId);
        if (pending != null && !pending.isEmpty()) {
            for (Object[] item : pending) {
                String senderId = (String) item[0];
                Long conversationId = (Long) item[1];
                notificationServ.notifyDelivery(senderId, conversationId);
            }
        }
        return ResponseEntity.ok("[ "+count+" ] Messages mark as Delivered");
    }
//    This method is used to return the cont of the unread messages of the user
    public ResponseEntity<?> getUnreadCountsOfUser(){
        String userId= currentUserSer.getUserId();
        if(userId==null || userId.isBlank()){
            return ResponseEntity.badRequest().body("userID is not valid");
        }
        boolean userExists=userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(userId);
        if(!userExists )return ResponseEntity.badRequest().body("User not found");
        Long count= messageDeliveryRepo.countUnreadMessages(userId);
        return ResponseEntity.ok(count);
    }
//    This method is used to return the count of the unread messages of the conversation
    public ResponseEntity<?> getUnreadCountsOfConversation(Long conversationId){
        String userId= currentUserSer.getUserId();
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
