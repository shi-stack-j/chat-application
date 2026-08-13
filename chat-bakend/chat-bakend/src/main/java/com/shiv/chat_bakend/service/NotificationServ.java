package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.WebSocketEventResDto;
import com.shiv.chat_bakend.dto.ack.DeliveryAckReqDto;
import com.shiv.chat_bakend.dto.ack.ReadAckReqDto;
import com.shiv.chat_bakend.dto.ack.SentAckResDto;
import com.shiv.chat_bakend.dto.ack.TypingAckReqDto;
import com.shiv.chat_bakend.dto.message.MessageEditReqDto;
import com.shiv.chat_bakend.dto.message.MessageNotificationInfoDto;
import com.shiv.chat_bakend.dto.reaction.MessageReactionResponseDto;
import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.enums.WebSocketEventTypeEnum;
import com.shiv.chat_bakend.evenentPayloads.*;
import com.shiv.chat_bakend.mapper.WebSocketEventMapper;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.MessageDeliveryRepo;
import com.shiv.chat_bakend.repository.UserBlockRepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotificationServ {
    @Autowired
    private ConversationRepo conversationRepo;
    @Autowired
    private MessageDeliveryRepo deliveryRepo;
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;
//    @Autowired
//    private MessageDeliverySer messageDeliverySer;
    @Autowired
    private UserBlockRepo userBlockRepo;
    @Autowired
    private UserBlockSer userBlockSer;
//    This service is used only for the notifications

//    This is used to inform other user that xyz user is online
    public void notifyOnline(String userId){
        System.out.println("Calling the notification service with the userID "+userId);
        Set<String> totalFriends=conversationRepo.findFriendIds(userId);
        if(totalFriends.isEmpty())return;
        Set<String> blockedUsers=userBlockRepo.findBlockedUsers(userId);
        totalFriends.removeAll(blockedUsers);
        UserPresencePayload userPresencePayload=UserPresencePayload.builder().online(true).userId(userId).build();
        log.info("Sending the Online notification to :- ",totalFriends);
        for(String friend:totalFriends){
            sendEvent(friend,WebSocketEventTypeEnum.USER_ONLINE,userPresencePayload);
        }
    }
    public void notifyOnline(String blockedUserId,String currentUserId){
        if(blockedUserId==null || blockedUserId.isEmpty() ||  currentUserId==null || currentUserId.isEmpty() )throw new RuntimeException("Acknowledgement request is not valid");
        UserPresencePayload payload=UserPresencePayload.builder().userId(currentUserId).online(true).build();
        sendEvent(blockedUserId,WebSocketEventTypeEnum.USER_ONLINE,payload);
    }
//    This is used to inform other user that zyx user is offline
//    This will inform to all the users that are in conversation with the given user
    public void notifyOffline(String userId){
        if(userId==null || userId.isEmpty())throw new RuntimeException("Offline ack request is not valid");
        System.out.println("Calling the notification service with the userID "+userId);
        Set<String> totalFriends=conversationRepo.findFriendIds(userId);
        if(totalFriends.isEmpty())return;
        Set<String> blockedUsers=userBlockRepo.findBlockedUsers(userId);
        totalFriends.removeAll(blockedUsers);
        UserPresencePayload userPresencePayload=UserPresencePayload.builder().online(false).userId(userId).build();


        for(String friend:totalFriends){
            sendEvent(friend,WebSocketEventTypeEnum.USER_OFFLINE,userPresencePayload);
        }
    }
//    This is to personally send the offline notification to the blocked user
    public void notifyOffline(String blockedUserId,String currentUserId){
        if(blockedUserId==null || blockedUserId.isEmpty() ||  currentUserId==null || currentUserId.isEmpty() )throw new RuntimeException("Acknowledgement request is not valid");
        UserPresencePayload payload=UserPresencePayload.builder().userId(currentUserId).online(false).build();
        sendEvent(blockedUserId,WebSocketEventTypeEnum.USER_OFFLINE,payload);
    }
//    Notify typing
    public void notifyTyping(String senderId, TypingAckReqDto typingAckReqDto){
        if(typingAckReqDto==null || senderId==null || senderId.isEmpty())throw new RuntimeException("typing ack request is not valid");
        String receiverId=conversationRepo.findReceiver(typingAckReqDto.getConversationId(),senderId).orElseThrow(()->new RuntimeException("No conversation found with the given id or not belongs to you"));
        if (!userBlockSer.canUserCommunicate(senderId, receiverId)) {
            return;
        }
        TypingStatusPayload typingStatusPayload=TypingStatusPayload
                .builder()
                .typing(typingAckReqDto.isTyping())
                .conversationId(typingAckReqDto.getConversationId())
                .senderId(senderId)
                .build();
        sendEvent(receiverId,WebSocketEventTypeEnum.USER_TYPING,typingStatusPayload);
    }
//    Notify DeliveryAck
    public void notifyDelivery(DeliveryAckReqDto deliveryAckReqDto,String receiverId){
        if(deliveryAckReqDto==null)throw new RuntimeException("Ack request is not valid");
        MessageNotificationInfoDto messageInfo = deliveryRepo.findMessageInfo(deliveryAckReqDto.getMessageId(),receiverId)
                .orElseThrow(() -> new RuntimeException("Invalid message or unauthorized receiver"));
        MessageStatusPayload statusPayload=MessageStatusPayload.builder().messageId(deliveryAckReqDto.getMessageId()).status(MessageStatusEnum.DELIVERED).conversationId(messageInfo.getConversationId()).build();
        sendEvent(messageInfo.getSenderId(),WebSocketEventTypeEnum.USER_MESSAGE,statusPayload);
    }
    public void notifyDelivery(String senderId, Long conversationId){
        if(senderId == null || conversationId == null) return;
        MessageStatusPayload statusPayload = MessageStatusPayload.builder()
                .conversationId(conversationId)
                .status(MessageStatusEnum.DELIVERED)
                .build();
//        messageDeliverySer.markAsDelivered(senderId);
        sendEvent(senderId, WebSocketEventTypeEnum.USER_MESSAGE, statusPayload);
    }
//    Notify Read
    public void notifyRead(ReadAckReqDto readAckReqDto, String receiverId){
        if(readAckReqDto==null || receiverId==null || receiverId.isEmpty())throw new RuntimeException("Ack request is not valid");
        String senderId=conversationRepo.findReceiver(readAckReqDto.getConversationId(),receiverId)
                .orElseThrow(() -> new RuntimeException("Invalid conversation or unauthorized receiver"));
        if(!userBlockSer.canUserCommunicate(receiverId,senderId))return;
        MessageStatusPayload statusPayload=MessageStatusPayload.builder().conversationId(readAckReqDto.getConversationId()).status(MessageStatusEnum.READ).build();
        sendEvent(senderId,WebSocketEventTypeEnum.USER_MESSAGE,statusPayload);
    }

//    Here the sender id will we the id of the user who is sending the edit notification
    public void notifyMessageEdit(MessageEditReqDto editReqDto,String receiverId, Long conversationId, LocalDateTime editTime){
        if(editReqDto==null )throw new RuntimeException("edit req details cannot be null");
        MessageEditPayload messageEditPayload=MessageEditPayload
                .builder()
                .conversationId(conversationId)
                .editedAt(editTime)
                .content(editReqDto.getNewContent())
                .messageId(editReqDto.getMessageId())
                .build();
        sendEvent(receiverId,WebSocketEventTypeEnum.MESSAGE_EDITED,messageEditPayload);
    }
    public void notifyMessageDelete(Long messageId,String receiverId, Long conversationId, LocalDateTime deleteTime){
        MessageDeletePayload messageDeletePayload=MessageDeletePayload
                .builder()
                .content("This message was deleted.")
                .conversationId(conversationId)
                .messageId(messageId)
                .deletedAt(deleteTime)
                .build();
        sendEvent(receiverId,WebSocketEventTypeEnum.MESSAGE_DELETED,messageDeletePayload);
    }

//    Here senderId is the id of the current authenticated user
    public void notifySent(SentAckResDto resDto,String currentUser){
        if(resDto==null || currentUser==null || currentUser.isEmpty() )throw new RuntimeException("Ack request is not valid");
//        This will sent the request back to the user and notify about that message is sent
        sendEvent(
                currentUser,
                WebSocketEventTypeEnum.USER_MESSAGE,
                resDto
        );
    }
//    This service is used to send the message reaction notification
    public void notifyReaction(MessageReactionResponseDto responseDto,String currentUserId){
        if(responseDto==null || currentUserId==null || currentUserId.isEmpty())throw new RuntimeException("reaction ack request is not valid");
        String receiverId=conversationRepo.findReceiver(responseDto.getConversationId(),currentUserId).orElseThrow(()->new RuntimeException("No conversation found with the given id or not belongs to you"));
        if (!userBlockSer.canUserCommunicate(currentUserId, receiverId)) {
            return;
        }
        sendEvent(receiverId,WebSocketEventTypeEnum.MESSAGE_REACTION,responseDto);
    }
    private <T> void sendEvent(
            String toUserId,
            WebSocketEventTypeEnum eventTypeEnum,
            T payload
    ){
        log.debug(
                "Sending {} event to {}",
                eventTypeEnum,
                toUserId
        );

        WebSocketEventResDto<T> webSocketEventResDto=WebSocketEventMapper.webSocketEventResDto(payload,eventTypeEnum);
        System.out.println("Sending the Event to :- "+toUserId+" event is :- "+webSocketEventResDto.toString());
        simpMessagingTemplate.convertAndSendToUser(
                toUserId,
                "/queue/notifications",
                webSocketEventResDto
        );
    }
//


}
