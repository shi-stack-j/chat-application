package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.ErrorResDto;
import com.shiv.chat_bakend.dto.LoginResDto;
import com.shiv.chat_bakend.repository.UserRepo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthSer {
    private final UserRepo userRepo;
    public AuthSer(UserRepo userRepo){
        this.userRepo=userRepo;
    }
    public ResponseEntity<?> handleLogin(String userId){
        if(userId==null || userId.isBlank() || userId.length()<3 || userRepo.isUserExists(userId.trim().toLowerCase())){
            ErrorResDto error=new ErrorResDto();
            error.setErrorCode("INVALID_USER_ID");
            error.setErrorMessage("UserID is not valid or already occupied");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        LoginResDto resDto=new LoginResDto();
        resDto.setToken(UUID.randomUUID().toString());
        resDto.setNickname(userId.trim().toLowerCase());
        resDto.setSuccess(true);
        resDto.setUserId(userId.trim().toLowerCase());
//        Adding the userAndtoken Mapping
        userRepo.addToken(resDto.getToken(),userId);
        return ResponseEntity.ok(resDto);
    }
}
