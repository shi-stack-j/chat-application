package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.mapper.OnlinePresenceMapper;

import com.shiv.chat_bakend.model.OnlinePresenceEn;
import com.shiv.chat_bakend.model.OnlineUserSession;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.ConversationRepo;
import com.shiv.chat_bakend.repository.OnlinePresenceRepo;
import com.shiv.chat_bakend.repository.OnlineRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Service
public class OnlinePresenceSer {
    @Autowired
    private UserRep userRep;
    @Autowired
    private OnlinePresenceRepo onlinePresenceRepo;
    @Autowired
    private OnlineRepo onlineRepo;
    @Autowired
    private ConversationRepo conversationRepo;

    public ResponseEntity<?> getLastSeen(String userId){
        if(userId==null || userId.isBlank())return ResponseEntity.badRequest().body("UserId is not valid");
        UserEn userEn=userRep.findByUserId(userId).orElseThrow();
        OnlinePresenceEn onlinePresenceEn=onlinePresenceRepo.findByUser_id(userId).orElseThrow();
        return ResponseEntity.ok(OnlinePresenceMapper.toOnlinePresenceResDto(onlinePresenceEn));
    }

    @Transactional
    public ResponseEntity<?> setLastFalse(String userId){
        if(userId==null || userId.isBlank())return ResponseEntity.badRequest().body("UserId is not valid");
        OnlinePresenceEn onlinePresenceEn=onlinePresenceRepo.findByUser_id(userId).orElseThrow();
//        onlinePresenceEn.setOnline(false);
        onlinePresenceEn.setLastSeenAt(LocalDateTime.now());
        return ResponseEntity.ok("Status updated successfully");
    }

    public boolean isOnline(String userId){
        if(userId==null || userId.isBlank() || userId.length()<3)throw new RuntimeException("User id is not valid");
        return onlineRepo.isOnline(userId);
    }

    public boolean saveOnlineUser(String userId,String sessionId){
        if(userId==null || userId.isBlank())throw new RuntimeException("User id information is not valid");
        if(sessionId==null || sessionId.isBlank())throw new RuntimeException("Session is not valid");
        boolean userExists= userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(userId);
        if(!userExists)throw new RuntimeException("User not found");
        boolean isExists=isOnline(userId);
        if(isExists)throw new RuntimeException("User already present in online users");
        boolean isSessionMapped=onlineRepo.isSessionMapped(sessionId);
        if(isSessionMapped)throw new RuntimeException("Session id already mapped");
        OnlineUserSession onlineUserSession=new OnlineUserSession();
        onlineUserSession.setUserId(userId);
        onlineUserSession.setSessionId(sessionId);
        onlineRepo.saveOnlineUser(onlineUserSession);
        return true;
    }

    public void removeOnlineUser(String userId){
        if(userId==null || userId.isBlank())throw new RuntimeException("User id information is not valid");
        boolean userExists= userRep.existsByUserIdAndDeletedFalseAndIsActiveTrue(userId);
        if(!userExists)throw new RuntimeException("USer not found");
        boolean isExists=isOnline(userId);
        if(!isExists)throw new RuntimeException("User not present in online users");
        onlineRepo.removeOnlineUser(userId);
    }

    public boolean isSession(String sessionId){
        if(sessionId==null || sessionId.isBlank())return false;
        return onlineRepo.existsSession(sessionId);
    }

    public String getUserId(String sessionId){
        if(sessionId==null || sessionId.isBlank())throw new RuntimeException("Session id is not valid");
        return onlineRepo.getUserId(sessionId);
    }
}
