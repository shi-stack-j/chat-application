package com.shiv.chat_bakend.repository;

import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenRepo {
    private final ConcurrentHashMap<String,String> tempTokens=new ConcurrentHashMap<>();

    public void addToken(String userId,String token){
        tempTokens.put(token,userId);
    }
    public boolean existsToken(String token){
        return tempTokens.containsKey(token);
    }
    public String removeToken(String token){
        return tempTokens.remove(token);
    }
    public String getUserName(String token){
        return tempTokens.get(token);
    }

}
