package com.shiv.chat_bakend.controller;
import com.shiv.chat_bakend.dto.message.MarkReadReqDto;
import com.shiv.chat_bakend.dto.message.MessageReadReqDto;
import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.service.MessageDeliverySer;
import com.shiv.chat_bakend.service.MessageSer;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/messages")
//Description :- This controller is used to manage the request regarding the message related services
public class MessageCon {
    @Autowired
    private MessageSer messageSer;
    @Autowired
    private MessageDeliverySer messageDeliverySer;
    @Autowired
    private ChatCon chatCon;

//    Checked
//    This method will return the counts of all the unread messages
    @GetMapping("/get/unreadCounts")
    public ResponseEntity<?> getUnreadCounts(
            @RequestHeader("X-UserId")String userId
    ){
        if(userId==null || userId.isBlank() || userId.length()<3)return ResponseEntity.badRequest().body("UserId is not valid");
        return messageDeliverySer.getUnreadCountsOfUser(userId);
    }
//    This method is used to mark the message as read
//    Checked
    @PostMapping("/mark/read")
    public ResponseEntity<?> markAsRead(
            @Valid @RequestBody MarkReadReqDto markReadReqDto,
            @RequestHeader("X-User-Id")String userId
    ){
        if(markReadReqDto==null)return ResponseEntity.badRequest().body("Request object is not valid");
        return messageDeliverySer.markAsRead(markReadReqDto,userId);
    }
//    This method is used fetch the last messages of the conversations
//    Checked
    @PostMapping("/get/latestMessages")
    public ResponseEntity<?> getLatestConversationMessages(
            @Valid @RequestBody MessageReadReqDto messageReadReqDto,
            @PageableDefault(
                    page = 0,
                    size = 20,
                    sort = "sentAt",
                    direction = Sort.Direction.DESC
            )Pageable pageable
    ){
        if(messageReadReqDto==null)return ResponseEntity.badRequest().body("Read Request is not valid");
        return messageSer.getLatestConversationMessages(messageReadReqDto,pageable);
    }
//    Checked
    @PostMapping("/send/message/")
    public ResponseEntity<?> sendMessage(
            @RequestHeader("X-Conversation-Id")Long conversationId,
            @Valid @RequestBody MessageReqDto messageReqDto,
            @RequestHeader("X-Sender-Id")String senderId
    ){
        if(conversationId==null || conversationId<=0)return ResponseEntity.badRequest().body("Conversation id is not valid");
        messageSer.sendMessage(messageReqDto,senderId);
        return ResponseEntity.ok("Message Sent successfully");
    }

//    Checked
    @PostMapping("/mark/delivered")
    public ResponseEntity<?> markAsDelivered(
            @RequestHeader("X-User-Id")String userId
    ){
        if(userId==null || userId.isBlank() || userId.length()<3)return ResponseEntity.badRequest().body("UserId is not valid");
        return messageDeliverySer.markAsDelivered(userId);
    }
}
