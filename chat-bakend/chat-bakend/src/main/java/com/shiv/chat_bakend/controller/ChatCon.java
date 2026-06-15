package com.shiv.chat_bakend.controller;


import com.shiv.chat_bakend.model.ChatMessage;
import com.shiv.chat_bakend.service.ChatSer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatCon {
    @Autowired
    private ChatSer chatSer;
//    User will send the message here and it will call the userService
    @MessageMapping("/chat")
    public void handleGroupMessage(ChatMessage chatMessage, SimpMessageHeaderAccessor accessor){
        System.out.println("Message recieved :- "+chatMessage.toString());
        String senderId=(String)accessor.getSessionAttributes().get("userId");
        System.out.println("Sendor id :- "+senderId);
        String receiverId= chatMessage.getReceiverId();
        System.out.println("Reciever id is :- "+receiverId);
        chatSer.handlePrivate(senderId,chatMessage);
    }
}
