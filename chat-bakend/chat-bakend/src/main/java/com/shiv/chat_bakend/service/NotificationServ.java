package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.WebSocketEventResDto;
import com.shiv.chat_bakend.dto.ack.DeliveryAckReqDto;
import com.shiv.chat_bakend.dto.ack.ReadAckReqDto;
import com.shiv.chat_bakend.dto.ack.TypingAckReqDto;
import com.shiv.chat_bakend.dto.message.MessageNotificationInfoDto;
import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.enums.WebSocketEventTypeEnum;
import com.shiv.chat_bakend.evenentPayloads.MessageStatusPayload;
import com.shiv.chat_bakend.evenentPayloads.TypingStatusPayload;
import com.shiv.chat_bakend.evenentPayloads.UserPresencePayload;
import com.shiv.chat_bakend.mapper.WebSocketEventMapper;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.MessageDeliveryRepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

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
//    This service is used only for the notifications

//    This is used to inform other user that xyz user is online
    public void notifyOnline(String userId){
        System.out.println("Calling the notification service with the userID "+userId);
        List<ConversationEn> allConversations=conversationRepo.findAllConversations(userId);
        Set<String> allFriends= allConversations.stream().map(
                conversationEn ->
                        conversationEn.getUserOne().getUserId().equals(userId)
                                ?conversationEn.getUserTwo().getUserId()
                                :conversationEn.getUserOne().getUserId()
        ).collect(Collectors.toSet());
        UserPresencePayload userPresencePayload=UserPresencePayload.builder().online(true).userId(userId).build();
        WebSocketEventResDto<UserPresencePayload> resDto= WebSocketEventMapper.webSocketEventResDto(userPresencePayload, WebSocketEventTypeEnum.USER_ONLINE);
        for(String friend:allFriends){
            simpMessagingTemplate.convertAndSendToUser(
                    friend,
                    "/queue/notifications",
                    resDto
            );
        }
    }
//    This is used to inform other user that zyx user is offline
    public void notifyOffline(String userId){
        List<ConversationEn> allConversations=conversationRepo.findAllConversations(userId);
        Set<String> allFriends= allConversations.stream().map(
                conversationEn ->
                        conversationEn.getUserOne().getUserId().equals(userId)
                                ?conversationEn.getUserTwo().getUserId()
                                :conversationEn.getUserOne().getUserId()
        ).collect(Collectors.toSet());
        UserPresencePayload userPresencePayload=UserPresencePayload.builder().online(false).userId(userId).build();
        WebSocketEventResDto<UserPresencePayload> resDto= WebSocketEventMapper.webSocketEventResDto(userPresencePayload, WebSocketEventTypeEnum.USER_OFFLINE);
        for(String friend:allFriends){
            simpMessagingTemplate.convertAndSendToUser(
                    friend,
                    "/queue/notifications",
                    resDto
            );
        }
    }
//    Notify typing
    public void notifyTyping(String senderId, TypingAckReqDto typingAckReqDto){
        if(typingAckReqDto==null)throw new RuntimeException("typing ack request is not valid");
        String receiverId=conversationRepo.findReceiver(typingAckReqDto.getConversationId(),senderId).orElseThrow(()->new RuntimeException("No conversation found with the given id or not belongs to you"));
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
        sendEvent(senderId, WebSocketEventTypeEnum.USER_MESSAGE, statusPayload);
    }

//    Notify Read
    public void notifyRead(ReadAckReqDto readAckReqDto, String receiverId){
        if(readAckReqDto==null )throw new RuntimeException("Ack request is not valid");
        String senderId=conversationRepo.findReceiver(readAckReqDto.getConversationId(),receiverId)
                .orElseThrow(() -> new RuntimeException("Invalid conversation or unauthorized receiver"));
        MessageStatusPayload statusPayload=MessageStatusPayload.builder().conversationId(readAckReqDto.getConversationId()).status(MessageStatusEnum.READ).build();
        sendEvent(senderId,WebSocketEventTypeEnum.USER_MESSAGE,statusPayload);
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
}
