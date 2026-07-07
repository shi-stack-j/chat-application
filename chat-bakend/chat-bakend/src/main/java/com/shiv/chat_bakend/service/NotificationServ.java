package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.WebSocketEventResDto;
import com.shiv.chat_bakend.enums.WebSocketEventTypeEnum;
import com.shiv.chat_bakend.evenentPayloads.UserPresencePayload;
import com.shiv.chat_bakend.mapper.WebSocketEventMapper;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NotificationServ {
    @Autowired
    private ConversationRepo conversationRepo;

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
            simpMessagingTemplate.convertAndSend(
                    "/queue/messages/"+friend,
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
            simpMessagingTemplate.convertAndSend(
                    "/queue/messages/"+friend,
                    resDto
            );
        }
    }
//    This is to inform other user that zyx user if typing
    public void notifyingTyping(String userId){

    }
}
