package com.shiv.chat_bakend.service;


import com.shiv.chat_bakend.evenentPayloads.UserBlockedEvent;
import com.shiv.chat_bakend.evenentPayloads.UserUnBlockEvent;
import com.shiv.chat_bakend.model.UserBlockEn;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.UserBlockRepo;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.apache.catalina.connector.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserBlockSer {
    private static final Logger log = LoggerFactory.getLogger(UserBlockSer.class);
    @Autowired
    private ApplicationEventPublisher applicationEventPublisher;
    @Autowired
    private CurrentUserSer userSer;
    @Autowired
    private UserBlockRepo userBlockRepo;
    @Autowired
    private UserRep userRep;
    @Autowired
    private CurrentUserSer currentUserSer;
//    @Autowired
//    private NotificationServ notificationServ;
//    This service is used to block the user
    @Transactional
    public ResponseEntity<?> blockUser(String blockedUserId){
        if(blockedUserId==null || blockedUserId.isEmpty())return ResponseEntity.badRequest().body("User id is not valid");
        UserEn blockedUser=isUserExits(blockedUserId);
        String blockerId=currentUserSer.getUserId();
        if(blockerId==null || blockerId.isEmpty())throw new RuntimeException("User is not authenticated");
        if (blockedUser==null )return ResponseEntity.badRequest().body("User not found with the given id :- "+blockedUserId);
        boolean alreadyBlocked=isAlreadyBlocked(blockerId,blockedUserId);
        if(alreadyBlocked)return ResponseEntity.ok("User Blocked Success");
        UserEn currUser=userRep.findByUserId(blockerId).orElseThrow(
                ()->new RuntimeException("User Not authenticated")
        );
        createUserBlock(currUser,blockedUser);
        log.info("Calling the block service");
//        This service will inform the blocked user that current user becomes offline
//        notificationServ.notifyOffline(blockedUserId,blockerId);
        applicationEventPublisher.publishEvent(new UserBlockedEvent(blockedUserId,blockerId));
        return ResponseEntity.ok("User Blocked Successfully");

    }
//    This service is used to get the user
    private UserEn isUserExits(String userId){
        return userRep.findByUserId(userId).orElse(null );
    }
//    This service is used to check that user is already blocked or not
    public boolean isAlreadyBlocked(String blockerId,String blockedId){
        return userBlockRepo.existsByBlocker_UserIdAndBlocked_UserId(blockerId,blockedId);
    }
//    This service will create the user block entity
    private void createUserBlock(UserEn blocker,UserEn blocked){
        UserBlockEn blockEn=UserBlockEn.builder()
                .blocked(blocked)
                .blocker(blocker)
                .blockedAt(LocalDateTime.now())
                .build();
        userBlockRepo.save(blockEn);
    }
//    This service is used to unblock the user
    @Transactional
    public ResponseEntity<?> unblockUser(String blockedUserId){
        if(blockedUserId==null || blockedUserId.isEmpty())return ResponseEntity.badRequest().body("Blocked user id is not correct");
        String blockerUserId= currentUserSer.getUserId();
        if(blockerUserId==null || blockerUserId.isEmpty())throw new RuntimeException("User Is not authenticated");
        Optional<UserBlockEn> userBlockEn=userBlockRepo.findUserBlocked(blockedUserId,blockerUserId);
        if(userBlockEn.isEmpty())return ResponseEntity.badRequest().body("User Not blocked");
        userBlockRepo.delete(userBlockEn.get());
//        notificationServ.notifyOnline(blockedUserId,blockerUserId);
        applicationEventPublisher.publishEvent(new UserUnBlockEvent(blockedUserId,blockerUserId));
        return ResponseEntity.ok("User Unblocked");
    }
//    Can user communicate
    public boolean canUserCommunicate(String currentUserId,String anotherUserId){
        if(currentUserId == null || currentUserId.isBlank())
            throw new RuntimeException();

        if(anotherUserId == null || anotherUserId.isBlank())
            throw new RuntimeException();

        if(currentUserId.equals(anotherUserId))
            throw new RuntimeException();
        boolean isCommunicationBlocked=userBlockRepo.isCommunicationBlocked(currentUserId,anotherUserId);
        return !isCommunicationBlocked;
    }
}
