package com.shiv.chat_bakend.service;
import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.dto.message.MessageResDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatSer {
    @Autowired
    private MessageSer messageSer;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    @Autowired
    private CurrentUserSer currentUserSer;
    private final SimpMessagingTemplate simpMessagingTemplate;
    public ChatSer(SimpMessagingTemplate simpMessagingTemplate){
        this.simpMessagingTemplate=simpMessagingTemplate;
    }


    public void handleMessage(MessageReqDto messageReqDto, String currUserId){
        System.out.println("Message received "+messageReqDto);
        System.out.println("Forwarding message.......");
        System.out.println("Calling the send message Service from HandleMessage1.......");
        MessageResDto messageResDto=messageSer.sendMessage(messageReqDto,currUserId);
        System.out.println("Message sent........"+messageResDto);
        simpMessagingTemplate.convertAndSendToUser(
                messageReqDto.getReceiver(),
                "/queue/messages",
                messageResDto
        );
    }
}
