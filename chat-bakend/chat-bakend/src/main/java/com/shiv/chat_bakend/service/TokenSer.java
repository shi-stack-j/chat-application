package com.shiv.chat_bakend.service;


import com.shiv.chat_bakend.repository.OnlineRepo;
import com.shiv.chat_bakend.repository.TokenRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class TokenSer {
    @Autowired
    private TokenRepo tokenRepo;
    @Autowired
    private OnlineRepo onlineRepo;

    public String createToken(String userId){
        if(userId==null || userId.isBlank() || userId.length()<3)throw new RuntimeException("Token or UserId is not valid");
        boolean userExists=onlineRepo.isOnline(userId);
        if(userExists)throw new RuntimeException("User is already loggedIn");
        String newToken= String.valueOf(UUID.randomUUID());
        tokenRepo.addToken(userId,newToken);
        return newToken;
    }

    public String getUserName(String token){
        if(token==null || token.isBlank())throw new RuntimeException("Token is not valid");
        boolean isToken= tokenRepo.existsToken(token);
        if(!isToken)throw new RuntimeException("Token is not valid");
        return tokenRepo.getUserName(token);
    }

    public String removeToken(String token){
        if(token==null || token.isBlank())throw new RuntimeException("Token is not valid");
        boolean isToken= tokenRepo.existsToken(token);
        if(!isToken)throw new RuntimeException("Token is not valid");
        return tokenRepo.removeToken(token);
    }

    public boolean isTokenExists(String token){
        if(token==null || token.isBlank())return false;
        return tokenRepo.existsToken(token);
    }

}
