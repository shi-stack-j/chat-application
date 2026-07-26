package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.OnlineUserSession;
import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OnlineRepo {
    private final ConcurrentHashMap<String, OnlineUserSession> onlineUsers = new ConcurrentHashMap<>();
    public void saveOnlineUser(OnlineUserSession onlineUserSession){
        String userId=onlineUserSession.getUserId().trim().toLowerCase();
        onlineUsers.put(userId,onlineUserSession);
    }
    public void removeOnlineUser(String userId){
        onlineUsers.remove(userId.trim().toLowerCase());
    }
    public boolean isOnline(String userId){
        return onlineUsers.containsKey(userId.trim().toLowerCase());
    }

}