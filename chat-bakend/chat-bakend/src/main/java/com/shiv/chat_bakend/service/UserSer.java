package com.shiv.chat_bakend.service;
import com.shiv.chat_bakend.dto.user.UserResDto;
import com.shiv.chat_bakend.mapper.UserMapper;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.OnlinePresenceRepo;
import com.shiv.chat_bakend.repository.OnlineRepo;
import com.shiv.chat_bakend.repository.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserSer {


    @Autowired
    private UserRep userRep;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    @Autowired
    private CurrentUserSer currentUserSer;
//    To return  that user is online or not
    public ResponseEntity<?> getUser(String userId){
        if(userId==null || userId.isBlank() || userId.length()<3){
            throw new RuntimeException("User id is not valid");
        }
//        Making the db call to check for the user
        Optional<UserEn>userEn=userRep.findByUserIdAndIsActiveTrueAndDeletedFalse(userId);
        if(userEn.isEmpty()){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User Not found with the given id");
        }
        boolean isOnline= onlinePresenceSer.isOnline(userId);
        UserResDto resDto= UserMapper.toUserResDto(userEn.get(),isOnline);
        return ResponseEntity.ok(resDto);
    }

    public ResponseEntity<?> getCurrentUser(){
        return ResponseEntity.ok(currentUserSer.getUser());
    }

}
