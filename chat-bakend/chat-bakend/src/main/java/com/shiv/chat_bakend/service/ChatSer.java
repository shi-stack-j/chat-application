package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.dto.message.MessageResDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class ChatSer {
    @Autowired
    private MessageSer messageSer;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    private final SimpMessagingTemplate simpMessagingTemplate;
    public ChatSer(SimpMessagingTemplate simpMessagingTemplate){
        this.simpMessagingTemplate=simpMessagingTemplate;
    }


    public void handleMessage(String senderId, MessageReqDto messageReqDto){
        if(senderId==null || senderId.isBlank())throw new RuntimeException("sender id is not valid");
        String receiverId= messageReqDto.getReceiver();
        String destination="/queue/messages/"+receiverId;
        System.out.println("Sending destination is :- "+destination);
        MessageResDto messageResDto=messageSer.sendMessage(messageReqDto,senderId);
        simpMessagingTemplate.convertAndSend(
                destination,
                messageResDto
        );
    }
}
