package com.shiv.chat_bakend.service;



import com.shiv.chat_bakend.dto.message.MessageEditReqDto;
import com.shiv.chat_bakend.dto.message.MessageReadReqDto;
import com.shiv.chat_bakend.dto.message.MessageReqDto;
import com.shiv.chat_bakend.dto.message.MessageResDto;
import com.shiv.chat_bakend.dto.reaction.MessageReactionDto;
import com.shiv.chat_bakend.dto.reaction.MessageReactionReqDto;
import com.shiv.chat_bakend.enums.MessageStatusEnum;
import com.shiv.chat_bakend.mapper.MessageMapper;
import com.shiv.chat_bakend.model.*;
import com.shiv.chat_bakend.projection.MessageReactionProjection;
import com.shiv.chat_bakend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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
    @Autowired
    private ConversationVisibilityRepo conversationVisibilityRepo;
    @Autowired
    private MessageVisibilityRepo messageVisibilityRepo;
    @Autowired
    private NotificationServ notificationServ;
    @Autowired
    private UserBlockSer userBlockSer;
    @Autowired
    private MessageDeliveryRepo messageDeliveryRepo;
    @Autowired
    private MessageReactionRepo messageReactionRepo;

    //    This is used to get the latest conversation messages
    public ResponseEntity<?> getLatestConversationMessages(MessageReadReqDto reqDto, Pageable pageable){
        String userId=currentUserSer.getUserId();
        if(reqDto==null || reqDto.getConversationId()==null )return ResponseEntity.badRequest().body("Conversation Id is not valid");
        System.out.println("Fetching the latest messages of conversation if L- "+reqDto.getConversationId());
        Optional<ConversationVisibilityEn> conversationVisibilityEn=conversationVisibilityRepo.findClearConversation(reqDto.getConversationId(),userId);
        LocalDateTime clearedAt=null;
        if(conversationVisibilityEn.isPresent())clearedAt=conversationVisibilityEn.get().getClearedAt();
        Set<Long> deletedMessageIds=messageVisibilityRepo.findDeletedMessageIds(userId, reqDto.getConversationId(),clearedAt);
        Long conversationId=reqDto.getConversationId();
        Page<MessageEn> messageEns;
        if(deletedMessageIds.isEmpty()) messageEns=messageRepo.findMessagesOfConversation(conversationId,clearedAt,userId,pageable);
        else messageEns=messageRepo.findMessagesOfConversationWithDeleted(conversationId,clearedAt,deletedMessageIds,userId,pageable);
        List<MessageDeliveryEn> outGoingMessageDeliveryEn = List.of();
        Set<Long> outGoingMessageIds=messageEns.stream()
                .filter(msg -> msg.getSender().getUserId().equals(userId))
                .map(msg -> msg.getId())
                .collect(Collectors.toSet());
        if(!outGoingMessageIds.isEmpty()){
            outGoingMessageDeliveryEn=messageDeliveryRepo.findByMessage_IdIn(outGoingMessageIds);
        }
        Map<Long, MessageStatusEnum> messageStatusMap =outGoingMessageDeliveryEn.stream()
                .collect(Collectors.toMap(
                        delivery -> delivery.getMessage().getId(),
                         MessageDeliveryEn::getStatus
                ));
        List<Long> messageIds = messageEns.stream()
                .map(MessageEn::getId)
                .collect(Collectors.toList());

        List<MessageReactionProjection> reactionProjections =
                messageIds.isEmpty()
                        ? List.of()
                        : messageReactionRepo.findReactionsByMessageIds(messageIds);

        Map<Long, List<MessageReactionDto>> reactionsMap =
                reactionProjections.stream()
                        .collect(Collectors.groupingBy(
                                MessageReactionProjection::getMessageId,
                                Collectors.mapping(
                                        reaction -> new MessageReactionDto(
                                                reaction.getUserId(),
                                                reaction.getEmoji()
                                        ),
                                        Collectors.toList()
                                )
                        ));
        Page<MessageResDto> messages=messageEns.map(msg->MessageMapper.toMessageResDto(msg,messageStatusMap.get(msg.getId()),reactionsMap.getOrDefault(msg.getId(), List.of())));

        return ResponseEntity.ok(messages);
    }
//    This method is used to manage the message flow
//    It is responsible
//    :- to create the message delivery record and
//    :- to transfer the message
//    :- to create the message in db
    @Transactional
    public MessageResDto sendMessage(MessageReqDto messageReqDto,String senderId,boolean isBlocked){
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
        if(!isBlocked){
            conversationEn.setLastMessageAt(savedMessageEn.getSentAt());
            conversationRepo.save(conversationEn);
        }
        deliverySer.createDelivery(savedMessageEn,isBlocked);
        MessageResDto messageResDto=MessageMapper.toMessageResDto(savedMessageEn,isBlocked?MessageStatusEnum.BLOCKED : MessageStatusEnum.SENT,List.of());
        return messageResDto;
    }

    @Transactional
    public ResponseEntity<?> editMessage(MessageEditReqDto editReqDto){
        if(editReqDto==null)return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Edit request is not valid");
        String userId=currentUserSer.getUserId();
        MessageEn messageEn=messageRepo.findAuthorizedMessageForSender(userId,editReqDto.getMessageId())
                .orElseThrow(()->new RuntimeException("Message id is not correct or not authorized"));
        Long conversationId=messageEn.getConversation().getId();
        String receiverID=messageEn.getReceiver().getUserId();
        boolean isDeleted= isDeletedFromBothSide(messageEn);
        if(isDeleted)return ResponseEntity.badRequest().body("Message already deleted");
        boolean isEditable=isEditable(messageEn);
        if(!isEditable)return ResponseEntity.badRequest().body("Message edit window expired");
        boolean isAlreadyDeleted=checkDeleteFromMySide(messageEn,conversationId,userId);
        if (isAlreadyDeleted)return ResponseEntity.badRequest().body("Message already deleted");
        if(messageEn.getOriginalContent()==null || messageEn.getOriginalContent().isEmpty()){
            messageEn.setOriginalContent(messageEn.getContent());
        }
        LocalDateTime editTime=LocalDateTime.now();
        messageEn.setEditedAt(editTime);
        messageEn.setContent(editReqDto.getNewContent());
        messageEn.setEdited(true);
        notificationServ.notifyMessageEdit(editReqDto,receiverID,conversationId,editTime);
        return ResponseEntity.ok("Message Updated Successfully");

    }
    //    Delete from everyone
    @Transactional
    public ResponseEntity<?> deleteFromEveryOne(Long messageId){
        if(messageId==null || messageId <=0)return ResponseEntity.badRequest().body("Message id is not correct");
        String currUser=currentUserSer.getUserId();
        Optional<MessageEn> messageEn=messageRepo.findAuthorizedMessageForSender(currUser,messageId);
        if(messageEn.isEmpty())return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Message id not correct or not authorize");
        boolean isDeleted= isDeletedFromBothSide(messageEn.get());
        String receiverId=messageEn.get().getReceiver().getUserId();
        Long conversationId=messageEn.get().getConversation().getId();
        if(isDeleted)return ResponseEntity.badRequest().body("Message already deleted...");
        boolean isEditable=isEditable(messageEn.get());
        if(!isEditable)return ResponseEntity.ok().body("Message cannot be deleted");
        LocalDateTime deleteTime=LocalDateTime.now();
        messageEn.get().setDeletedAt(deleteTime);
        messageEn.get().setDeletedForEveryOne(true);
        messageEn.get().setOriginalContent(messageEn.get().getContent());
        messageEn.get().setContent("This message was deleted.");
        notificationServ.notifyMessageDelete(messageId,receiverId,conversationId,deleteTime);
        return ResponseEntity.ok("Message Deleted Successfully");
    }
    //    This method is to check that message is not already deleted
    private boolean isDeletedFromBothSide(MessageEn messageEn){
        return messageEn.isDeletedForEveryOne();
    }
    //    This method is used to check that message is editable or not
    private boolean isEditable(MessageEn messageEn){return (Duration.between(messageEn.getSentAt(),LocalDateTime.now()).toMinutes() <= 30);}

//    This service is used to check that is message DeletedFrom my side or did clear chat
    private boolean checkDeleteFromMySide(MessageEn messageEn,Long conversationId, String userId){
        boolean isAlreadyDeleted=messageVisibilityRepo.checkIsDeleted(userId,messageEn.getId());
        if(isAlreadyDeleted)return true;
        boolean isClearedBefore=conversationVisibilityRepo.checkIsMessageCleared(conversationId,userId,messageEn.getSentAt()).orElse(false);
        return isClearedBefore;
    }

}
