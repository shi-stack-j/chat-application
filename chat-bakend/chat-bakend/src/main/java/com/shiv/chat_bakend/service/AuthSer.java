package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.auth.LogReqDto;
import com.shiv.chat_bakend.dto.auth.LogResDto;
import com.shiv.chat_bakend.dto.auth.RegisterReqDto;
import com.shiv.chat_bakend.mapper.LoginMapper;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.UserRep;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthSer {
    @Autowired
    private TokenSer tokenSer;

    @Autowired
    private UserRep userRep;

    public ResponseEntity<?> login(LogReqDto loginDetails){
        String userId=loginDetails.getUserId();
        String password=loginDetails.getPassword();
        if(userId==null || userId.isBlank() || password==null || password.isBlank()){
            throw new RuntimeException("UserName or password is not correct");
        }
        Optional<UserEn> userEn=userRep.findByUserId(userId);
        if(userEn.isEmpty() || userEn.get().isDeleted() || !userEn.get().isActive())return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        LogResDto resDto= LoginMapper.logResDto(userEn.get());
        resDto.setToken(tokenSer.createToken(userId));
        return ResponseEntity.ok(resDto);
    }
    @Transactional
    public ResponseEntity<?> register(RegisterReqDto registerDetails){
        if(registerDetails==null)return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Register Details are required");
        String userId=registerDetails.getUserId();
        String password=registerDetails.getPassword();
        String nickName=registerDetails.getNickName();
        String avatarUrl=registerDetails.getAvatarUrl();
        if(userId==null || userId.isBlank() || password==null || password.isBlank() || nickName==null || nickName.isBlank()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Provide valid Details");
        }
        UserEn userEn=LoginMapper.toUserEn(registerDetails);
        UserEn savedEn=userRep.save(userEn);
        return ResponseEntity.status(HttpStatus.CREATED).body("User Created Successfully");
    }
}
