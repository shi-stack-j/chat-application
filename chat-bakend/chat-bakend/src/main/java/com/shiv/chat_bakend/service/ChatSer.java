package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.ChatMsgResDto;
import com.shiv.chat_bakend.model.ChatMessage;
import com.shiv.chat_bakend.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatSer {
    @Autowired
    private UserRepo userRepo;
    private final SimpMessagingTemplate simpMessagingTemplate;
    public ChatSer(SimpMessagingTemplate simpMessagingTemplate){
        this.simpMessagingTemplate=simpMessagingTemplate;
    }

    public void handlePrivate(String senderId, ChatMessage message){
        if(senderId==null || senderId.isBlank()){
            throw new RuntimeException("Ids are not correct");
        }
        ChatMsgResDto resDto=new ChatMsgResDto(
                senderId,
                message.getContent()
        );
        if(!userRepo.isUserExists(message.getReceiverId().trim().toLowerCase())){
            throw new RuntimeException("USer is not log in");
        }
        String receiverId=message.getReceiverId().trim().toLowerCase();
        String destiniation="/queue/messages/"+receiverId;
        System.out.println("Sending desitination is :- "+destiniation);
        simpMessagingTemplate.convertAndSend(
                destiniation,
                resDto
        );
    }
}
