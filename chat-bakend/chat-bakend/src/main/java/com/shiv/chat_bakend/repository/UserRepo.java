package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.UserMod;
import org.springframework.stereotype.Repository;

import java.security.Key;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class UserRepo{
//    This map is used to manage the current online users
    private Map<String, UserMod> onlineUsers = new HashMap<>();
//    This map is used to manage the sessions  of the onlineUsers
    private Map<String,String> onlineSessions=new HashMap<>();
//    This is used to manage the token because to prevent unauthorized mapping
    private Map<String,String> loginTokens=new ConcurrentHashMap<>();

//    This is used to return the status of the given userid
    public boolean isUserExists(String userId){
        return onlineUsers.containsKey(userId);
    }

//    This is used to return the current user
    public Optional<UserMod> findUserById(String userId){
        if(onlineUsers.containsKey(userId)){
            return Optional.of(onlineUsers.get(userId));
        }
        return Optional.empty();
    }

//    This is used to delete both session and the users
    public Optional<UserMod> deleteUser(String sessionId){
        if(sessionId.contains(sessionId)){
            String userId=onlineSessions.remove(sessionId);
            return Optional.of(onlineUsers.remove(userId));
        }
        return Optional.empty();
    }
//
    public boolean isSessionExists(String sessionId){
        return onlineSessions.containsKey(sessionId);
    }
//    Add user and its session
    public Optional<UserMod> createUser(String userId,String sessionId,UserMod userMod){
        if(onlineUsers.containsKey(userId) || onlineSessions.containsKey(sessionId))return Optional.empty();
        onlineUsers.put(userId,userMod);
        onlineSessions.put(sessionId,userId);
        UserMod savedUser=onlineUsers.get(userId);
        return Optional.of(savedUser);
    }

//    To add the token and userId to the temp token service
    public Optional<String> addToken(String token , String userId){
        loginTokens.put(token,userId);
        return Optional.of(token);
    }
//    To remove the token after adding the final values
    public Optional<String> removeToken(String token){
        if(!loginTokens.containsKey(token))return Optional.empty();
        return Optional.of(loginTokens.remove(token));
    }
//    To get the username with the token
    public Optional<String> getUserName(String token){
        boolean hasToken=isTokenExists(token);
        if(!loginTokens.containsKey(token))return Optional.empty();
        return Optional.of(loginTokens.get(token));
    }
//
    public boolean isTokenExists(String token){
        return loginTokens.containsKey(token);
    }
}