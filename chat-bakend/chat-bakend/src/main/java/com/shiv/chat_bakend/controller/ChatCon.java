package com.shiv.chat_bakend.controller;


import com.shiv.chat_bakend.dto.ack.DeliveryAckReqDto;
import com.shiv.chat_bakend.dto.ack.ReadAckReqDto;
import com.shiv.chat_bakend.dto.ack.TypingAckReqDto;
import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.service.ChatSer;
import com.shiv.chat_bakend.service.NotificationServ;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatCon {
    @Autowired
    private ChatSer chatSer;
    @Autowired
    private NotificationServ notificationServ;
//    User will send the message here and it will call the userService

//    This will manage the message that is received to the backend and will process further
    @MessageMapping("/chat")
    public void handleChat(@Valid MessageReqDto messageReqDto, Principal principal){
        System.out.println("Message received on chat controller......");
        chatSer.handleMessage(messageReqDto,principal.getName());
    }
    @MessageMapping("/chat.deliveryAck")
    public void deliveryAck(@Valid  DeliveryAckReqDto deliveryAckReqDto,Principal principal){
//        This is the person who have send the request
        String receiverId=principal.getName();
        System.out.println("Message received on DeliveryAcknowledge from :- "+receiverId);
        notificationServ.notifyDelivery(deliveryAckReqDto,receiverId);
    }
    @MessageMapping("/chat.readAck")
    public void readAck(@Valid  ReadAckReqDto readAckReqDto,Principal principal){
        String receiverId= principal.getName();
        System.out.println("Read acknowledge is received from the user "+principal.getName());
        notificationServ.notifyRead(readAckReqDto,receiverId);
    }
    @MessageMapping("/chat.typingAck")
    public void typingAck(@Valid TypingAckReqDto typingAckReqDto,Principal principal){
//        This is the id of the person who is typing
        System.out.println("Typing acknowledge is received from the user "+principal.getName());
        String senderId=principal.getName();
        notificationServ.notifyTyping(senderId,typingAckReqDto);
    }
}
