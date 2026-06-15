package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.ErrorResDto;
import com.shiv.chat_bakend.dto.SearchResDto;
import com.shiv.chat_bakend.model.UserMod;
import com.shiv.chat_bakend.repository.UserRepo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
public class UserSer {
    private final UserRepo userRepo;
    public UserSer(UserRepo userRepo){
        this.userRepo=userRepo;
    }

    public ResponseEntity<?> registerUser(String tokenId,String sessionId){
        if(tokenId==null  || tokenId.isBlank() ){
            ErrorResDto errorResDto = new ErrorResDto();
            errorResDto.setErrorMessage("UserId  is not valid ");
            errorResDto.setErrorCode("INVALID_REQUEST");
            return ResponseEntity.badRequest().body(errorResDto);
        }
        tokenId=tokenId.trim().toLowerCase();
        if(!userRepo.isTokenExists(tokenId)){
            ErrorResDto errorRes=new ErrorResDto();
            errorRes.setErrorCode("INVALID_TOKEN");
            errorRes.setErrorMessage("Token is not valid");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorRes);
        }
        String userId=userRepo.getUserName(tokenId).get();
        UserMod userMod=new UserMod();
        userMod.setUserID(userId);
        userMod.setOnline(true);
        userMod.setSessionID(sessionId);
        Optional<UserMod> currentMod = userRepo.createUser(userId,sessionId,userMod);
        if(currentMod.isEmpty()){
            ErrorResDto resDto=new ErrorResDto();
            resDto.setErrorMessage("Problem while creating the user");
            return ResponseEntity.internalServerError().body(resDto);
        }
//        Removing the token after successful registration
        userRepo.removeToken(tokenId);
        return ResponseEntity.ok(currentMod);
    }
//    To remove the user from onlineusers and its session
    public ResponseEntity<?> removeUser(String sessionId){
        if(sessionId==null || sessionId.isBlank())return ResponseEntity.badRequest().body("SessiondId is not correct");
        boolean isExists= userRepo.isSessionExists(sessionId);
        if(isExists){
            userRepo.deleteUser(sessionId);
            return ResponseEntity.ok("UserCon Removed Successfully");
        }
        return ResponseEntity.badRequest().body("Session Does not exists");
    }
//    To return  that user is online or not
    public SearchResDto getUser(String userId){
        if(userId==null || userId.isBlank()){
            return null;
        }
        if(userRepo.isUserExists(userId)){
            SearchResDto resDto=new SearchResDto(userId,true);
            return resDto;
        }
        return null;
    }
}
