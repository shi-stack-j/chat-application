package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.conversation.ConversationDto;
import com.shiv.chat_bakend.dto.conversation.ConversationReqDto;
import com.shiv.chat_bakend.dto.conversation.ConversationSummaryResDto;
import com.shiv.chat_bakend.dto.user.UserResDto;
import com.shiv.chat_bakend.mapper.ConversationMapper;
import com.shiv.chat_bakend.mapper.UserMapper;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.ConversationVisibilityEn;
import com.shiv.chat_bakend.model.MessageEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.projection.UserBlockProjection;
import com.shiv.chat_bakend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ConversationSer {
    @Autowired
    private UserBlockSer userBlockSer;
    @Autowired
    private ConversationVisibilityRepo conversationVisibilityRepo;
    @Autowired
    private ConversationRepo conversationRepo;
    @Autowired
    private UserRep userRep;
    @Autowired
    private MessageRepo messageRepo;
    @Autowired
    private MessageDeliveryRepo messageDeliveryRepo;
    @Autowired
    private OnlinePresenceRepo onlinePresenceRepo;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    @Autowired
    private CurrentUserSer currentUserSer;
    @Autowired
    private MessageVisibilityRepo messageVisibilityRepo;
    @Autowired
    private UserBlockRepo userBlockRepo;

    //    This method is used to return the conversation of the user
//    IT is not getting used anywhere inside the frontend
    public ResponseEntity<?> getUserConversations(Pageable pageable){
        String userId= currentUserSer.getUserId();
        if(userId==null || userId.isBlank())return ResponseEntity.badRequest().body("UserId is not correct");
        Page<ConversationEn> conversationEns=conversationRepo.findUserConversations(userId,pageable);
        return ResponseEntity.ok(conversationEns);
    }

//    This service is used to fetch the summary of the service
//    Not used
    public ResponseEntity<?> getConversationSummary(Pageable pageable) {
        String userId= currentUserSer.getUserId();
        if (userId == null || userId.isBlank()) return ResponseEntity.badRequest().body("UserId is not valid");
        Page<ConversationEn> conversationEns = conversationRepo.findUserConversations(userId, pageable);
        Page<ConversationSummaryResDto> conversationResponse = conversationEns.map(conversationEn -> convertToSummary(conversationEn, userId));
        return ResponseEntity.ok(conversationResponse);
    }

//    Not used
    public ConversationSummaryResDto convertToSummary(ConversationEn conversationEn,String user_id){

        if(conversationEn==null || user_id==null || user_id.isBlank())throw new RuntimeException("Conversation details or user id is not valid");
//        First we are fetching the last cleared time for this conversation for this user
        Optional<ConversationVisibilityEn> conversationVisibilityEn=conversationVisibilityRepo.findClearConversation(conversationEn.getId(),user_id);
        LocalDateTime clearedAt=null;
        if(conversationVisibilityEn.isPresent())clearedAt=conversationVisibilityEn.get().getClearedAt();
//        Now we are fetching the ids of the deleted messages of this conversation for particular user
        Set<Long> deletedMessageIds=messageVisibilityRepo.findDeletedMessageIds(user_id,conversationEn.getId(),clearedAt);
//        Now we have to fetch the unread messages of this conversation
        long unreadMessages;
        List<MessageEn> lastMessage;
        Page<MessageEn> allMessage;
        Pageable pageable=PageRequest.of(0,1);
//        Now we are fetching the last message of the conversation
        if(deletedMessageIds.isEmpty()){
            unreadMessages=messageDeliveryRepo.countUnreadMessagesByConversation(user_id,conversationEn.getId(),clearedAt);
            allMessage=messageRepo.findMessagesOfConversation(conversationEn.getId(),clearedAt,user_id ,pageable);
            lastMessage=allMessage.getContent();
        }
        else{
//            Here the deleted message ids are included means the messages which are deleted will we removed
            unreadMessages=messageDeliveryRepo.countUnreadMessagesByConversationWithDeletedMessages(user_id, conversationEn.getId(), clearedAt,deletedMessageIds);
            allMessage=messageRepo.findMessagesOfConversationWithDeleted(conversationEn.getId(),clearedAt,deletedMessageIds ,user_id,pageable);
            lastMessage=allMessage.getContent();
        }

        String lastMsg;
        LocalDateTime lastMessageTime;
        UserEn otherUser;
        if(lastMessage.isEmpty()){
            lastMsg="";
            lastMessageTime=null;
        }else{
            lastMsg=lastMessage.get(0).getContent();
            lastMessageTime=lastMessage.get(0).getSentAt();
        }
//        Here we have to send the details of the sender to the frontend
        if(conversationEn.getUserOne().getUserId().equals(user_id)){
            otherUser=conversationEn.getUserTwo();
        }else{
            otherUser=conversationEn.getUserOne();
        }
        UserEn userEn=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(user_id).orElseThrow();
        //        This is to check the block exists or not
        UserBlockProjection blockProjection=userBlockRepo.findBlockInfoBetweenUsers(user_id,otherUser.getUserId());

        boolean isOtherUserOnline,isOtherUserBlocked;
        if(blockProjection.isAnyBlock())isOtherUserOnline=false;
        else isOtherUserOnline = onlinePresenceSer.isOnline(otherUser.getUserId());
        if(blockProjection.isCurrentUserBlocker())isOtherUserBlocked=true;
        else isOtherUserBlocked=false;
        UserResDto resDto=UserMapper.toUserResDto(otherUser,isOtherUserOnline);
        ConversationSummaryResDto conversationSummaryResDto=ConversationMapper.toConversationResSummary(conversationEn,resDto,lastMsg,unreadMessages,lastMessageTime,isOtherUserBlocked);
        return conversationSummaryResDto;
    }
//    This is internal method it is used only to convert the entity to the summary
//    private ConversationSummaryResDto convertToSummary(ConversationEn conversationEn,String userId){
//        if(conversationEn==null || userId==null || userId.isBlank())throw new RuntimeException("Provide valid details");
//        UserEn userEn=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(userId).orElseThrow();
//        Long unreadMessages= messageDeliveryRepo.countUnreadMessagesByConversation(userId,conversationEn.getId());
//        UserResDto userResDto= UserMapper.toUserResDto(userEn,false);
//        Pageable pageable= PageRequest.of(0,1);
//        List<MessageEn> lastMessage=messageRepo.findByConversation_IdOrderBySentAtDesc(conversationEn.getId(),pageable);
//        String lastMsg;
//        LocalDateTime lastMessageTime;
//        if(lastMessage.isEmpty()){
//            lastMsg="";
//            lastMessageTime=conversationEn.getLastMessageAt();
//        }else{
//            lastMsg=lastMessage.get(0).getContent();
//            lastMessageTime=lastMessage.get(0).getSentAt();
//        }
//        ConversationSummaryResDto conversationSummaryResDto=ConversationMapper.toConversationResSummary(conversationEn,userResDto,lastMsg,lastMessageTime,unreadMessages);
//        return conversationSummaryResDto;
//    }
//    This method is used to
//    Return conversation if exists
//    create conversation if not exists
//    Done
    public ResponseEntity<?> getOrCreateConversation(ConversationReqDto conversationReqDto){
        String senderId= currentUserSer.getUserId();
        if(senderId==null || senderId.isBlank() )throw new RuntimeException("Sender id is not correct");
        if(conversationReqDto==null )throw new RuntimeException("Conversation request is not valid");
        String userOne,userTwo;
        if(senderId.compareTo(conversationReqDto.getReceiverId())<0){
            userOne=senderId;
            userTwo=conversationReqDto.getReceiverId();
        }else{
            userOne=conversationReqDto.getReceiverId();
            userTwo=senderId;
        }
//        This is to check the block
        if (!userBlockSer.canUserCommunicate(senderId, conversationReqDto.getReceiverId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found.");
        }
        Optional<ConversationEn> conversationEn=conversationRepo.findByUserOne_UserIdAndUserTwo_UserId(userOne,userTwo);
        if(conversationEn.isPresent()){
            ConversationDto conversationDto=ConversationMapper.toConversationDto(conversationEn.get());
            return ResponseEntity.ok(conversationDto);
        }
        conversationEn=createConversation(userOne,userTwo);
        if(conversationEn.isEmpty())return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error while creating the conversation");

        return ResponseEntity.ok(ConversationMapper.toConversationDto(conversationEn.get()));
    }
//    This method is used to create conversation service
    @Transactional
    private Optional<ConversationEn> createConversation(String userOne, String userTwo){
        if(userOne==null || userOne.isBlank() || userTwo==null || userTwo.isBlank())throw new RuntimeException("User id's are not valid");
        Optional<UserEn> firstUser=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(userOne);
        if(firstUser.isEmpty())throw new RuntimeException("UserId :- { "+userOne+" } is not valid");
        Optional<UserEn> secondUser=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(userTwo);
        if(secondUser.isEmpty())throw new RuntimeException("UserId :- { "+userOne+" } is not valid");
        ConversationEn conversationEn=ConversationMapper.toConversationEntity(firstUser.get(),secondUser.get());
        ConversationEn save = conversationRepo.save(conversationEn);
        return Optional.of(save);
    }


//    Flow for the conversations will be
//    When user will login
//    -> Their will we call to fetch all the conversations summary
//    -> When user will click on particular conversation then their will we call to fetch the messages
}