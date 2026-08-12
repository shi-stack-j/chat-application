package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.VisibilityResponseDto;
import com.shiv.chat_bakend.model.ConversationEn;
import com.shiv.chat_bakend.model.ConversationVisibilityEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.ConversationVisibilityRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ConversationVisibilitySer {
    @Autowired
    private UserRep userRep;
    @Autowired
    private ConversationVisibilityRepo conversationVisibilityRepo;
    @Autowired
    private CurrentUserSer currentUserSer;
    @Autowired
    private ConversationRepo conversationRepo;
    //    Clear conversation
    @Transactional
    public ResponseEntity<?> clearConversation(Long conversationId){
        if(conversationId==null || conversationId<=0)return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Headers are not correct");
        String userId=currentUserSer.getUserId();
        Optional<ConversationVisibilityEn> conversationVisibilityEn=conversationVisibilityRepo.findClearConversation(conversationId,userId);
        if(conversationVisibilityEn.isEmpty()){
            createClearConversation(conversationId,userId);
        }else{
            conversationVisibilityEn.get().setClearedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok("Conversation cleared success");
    }
//    Here conversation En is the entity that is requested being cleared
//    UserEn is the user who is requesting to clear the conversation
    private void createClearConversation(Long conversationId, String userId){
        if(userId==null )throw new RuntimeException("User not found");
        Optional<ConversationEn> conversationEn=conversationRepo.findAuthorizedConversation(conversationId,userId);
        if(conversationEn.isEmpty())throw new RuntimeException("Conversation not found or Not authorized");
        UserEn currentUser=userRep.findByUserId(userId).orElseThrow(()->new RuntimeException("User Not found for the given id :- "+userId));
        ConversationVisibilityEn conversationVisibilityEn=ConversationVisibilityEn
                .builder()
                .conversation(conversationEn.get())
                .clearedAt(LocalDateTime.now())
                .user(currentUser)
                .build();
        conversationVisibilityRepo.save(conversationVisibilityEn);
    }
//    get last cleared
    public ResponseEntity<?> getClearConversation(Long conversationId){
        if(conversationId==null || conversationId<=0)throw new RuntimeException("Conversation id is not correct");
        String userId=currentUserSer.getUserId();
        Optional<ConversationVisibilityEn> visibilityEn = conversationVisibilityRepo.findClearConversation(conversationId,userId);
        if(visibilityEn.isEmpty())return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Conversation not found or unauthorized");
        VisibilityResponseDto responseDto=VisibilityResponseDto
                .builder()
                .id(visibilityEn.get().getId())
                .clearedAt(visibilityEn.get().getClearedAt())
                .conversationId(conversationId)
                .userId(userId)
                .build();
        return ResponseEntity.ok(responseDto);
    }
}
