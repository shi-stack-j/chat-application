package com.shiv.chat_bakend.repository;

import com.shiv.chat_bakend.model.OnlineUserSession;
import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OnlineRepo {
    private final ConcurrentHashMap<String, OnlineUserSession> onlineUsers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String , String> onlineSessions=new ConcurrentHashMap<>();
    public void saveOnlineUser(OnlineUserSession onlineUserSession){
        String userId=onlineUserSession.getUserId().trim().toLowerCase();
        onlineUsers.put(userId,onlineUserSession);
        onlineSessions.put(onlineUserSession.getSessionId(),onlineUserSession.getUserId());
    }
    public void removeOnlineUser(String userId){
        OnlineUserSession session=onlineUsers.remove(userId.trim().toLowerCase());
        onlineSessions.remove(session.getSessionId());
    }
    public boolean isOnline(String userId){
        return onlineUsers.containsKey(userId.trim().toLowerCase());
    }
    public boolean isSessionMapped(String sessionId){
        return onlineSessions.containsKey(sessionId);
    }
    public String getUserId(String sessionId){
        return onlineSessions.get(sessionId);
    }
    public boolean existsSession(String sessionId){
        return onlineSessions.containsKey(sessionId);
    }
}
