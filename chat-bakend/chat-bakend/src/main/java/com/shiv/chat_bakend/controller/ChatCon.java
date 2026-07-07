package com.shiv.chat_bakend.controller;


import com.shiv.chat_bakend.dto.message.MessageReqDto;
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

//    This will manage the message that is received to the backend and will process further
    @MessageMapping("/chat")
    public void handleChat(MessageReqDto messageReqDto,SimpMessageHeaderAccessor accessor){
        String senderId= (String) accessor.getSessionAttributes().get("userId");
        chatSer.handleMessage(senderId,messageReqDto);
    }
}
