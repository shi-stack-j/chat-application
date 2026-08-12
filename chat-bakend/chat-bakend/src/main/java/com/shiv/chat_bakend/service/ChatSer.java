package com.shiv.chat_bakend.service;
import com.shiv.chat_bakend.dto.ack.SentAckResDto;
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
    @Autowired
    private UserBlockSer userBlockSer;
    @Autowired
    private NotificationServ notificationServ;
    public ChatSer(SimpMessagingTemplate simpMessagingTemplate){
        this.simpMessagingTemplate=simpMessagingTemplate;
    }
    public void handleMessage(MessageReqDto messageReqDto, String currUserId){
        System.out.println("Message received "+messageReqDto);
        System.out.println("Forwarding message.......");
        System.out.println("Calling the send message Service from HandleMessage1.......");
        boolean isBlocked=!userBlockSer.canUserCommunicate(currUserId, messageReqDto.getReceiver());
        MessageResDto messageResDto=messageSer.sendMessage(messageReqDto,currUserId,isBlocked);
        SentAckResDto sentAckResDto=SentAckResDto.builder()
                .messageId(messageResDto.getMessageId())
                .conversationId(messageResDto.getConversationId())
                .messageStatus(messageResDto.getStatus())
                .messageTempId(messageReqDto.getTempMessageId())
                .build();
        notificationServ.notifySent(sentAckResDto,messageResDto.getSenderId());
        System.out.println("Message sent........"+messageResDto);
        if (isBlocked) {
            return;
        }
        simpMessagingTemplate.convertAndSendToUser(
                messageReqDto.getReceiver(),
                "/queue/messages",
                messageResDto
        );
    }
}
