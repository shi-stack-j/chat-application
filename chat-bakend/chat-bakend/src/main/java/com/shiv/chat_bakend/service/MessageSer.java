package com.shiv.chat_bakend.service;



import com.shiv.chat_bakend.dto.message.MessageReadReqDto;
import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.dto.message.MessageResDto;
import com.shiv.chat_bakend.mapper.MessageMapper;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.MessageRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@Service
public class MessageSer {
    @Autowired
    private MessageRepo messageRepo;
    @Autowired
    private ConversationRepo conversationRepo;
    @Autowired
    private UserRep userRep;
    @Autowired
    private MessageDeliverySer deliverySer;
    @Autowired
    private CurrentUserSer currentUserSer;
//    This is used to get the latest conversation messages
    public ResponseEntity<?> getLatestConversationMessages(MessageReadReqDto reqDto, Pageable pageable){
        if(reqDto==null )return ResponseEntity.badRequest().body("Conversation Id is not valid");
        System.out.println("Fetching the latest messages of conversation if L- "+reqDto.getConversationId());
        Long conversationId=reqDto.getConversationId();
        Page<MessageEn> messageEns=messageRepo.findByConversation_IdOrderBySentAtDesc(conversationId,pageable);
        Page<MessageResDto> messages=messageEns.map(msg->MessageMapper.toMessageResDto(msg));
        return ResponseEntity.ok(messages);
    }
//    This method is used to manage the message flow
//    It is responsible
//    :- to create the message delivery record and
//    :- to transfer the message
//    :- to create the message in db
    @Transactional
    public MessageResDto sendMessage(MessageReqDto messageReqDto,String senderId){
        System.out.println("Sending the message user id is from Send Message :- "+senderId);
        if(messageReqDto==null || senderId==null || senderId.isBlank())throw new RuntimeException("Message Request is not valid");
        Optional<UserEn> sender=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(senderId);
        if(sender.isEmpty())throw new RuntimeException("Sender is not valid");
        Optional<UserEn> receiver=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(messageReqDto.getReceiver());
        if(receiver.isEmpty())throw new RuntimeException("Receiver not found");
        String firstUser;
        String secondUser;
        if(sender.get().getUserId().compareTo(receiver.get().getUserId()) < 0){
            secondUser=receiver.get().getUserId();
            firstUser=sender.get().getUserId();
        }else{
            secondUser=sender.get().getUserId();;
            firstUser=receiver.get().getUserId();
        }
        ConversationEn conversationEn=conversationRepo.findByUserOne_UserIdAndUserTwo_UserId(firstUser,secondUser).orElseThrow();
        MessageEn messageEn = MessageMapper.toMessageEn(messageReqDto,sender.get(),receiver.get(),conversationEn);
        MessageEn savedMessageEn=messageRepo.save(messageEn);
        conversationEn.setLastMessageAt(savedMessageEn.getSentAt());
        conversationRepo.save(conversationEn);
        deliverySer.createDelivery(savedMessageEn);
        MessageResDto messageResDto=MessageMapper.toMessageResDto(savedMessageEn);
        return messageResDto;
    }

}
