package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.SearchResDto;
import com.shiv.chat_bakend.repository.UserRepo;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.support.SimpleTriggerContext;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.sql.SQLOutput;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Component
public class WebSocketEventListener {
    @Autowired
    private UserRepo userRepo;
    public final UserSer userSer;
    public WebSocketEventListener(UserSer userSer){
        this.userSer=userSer;
    }


//    This event is used to handle the connection
    @EventListener
    public void handleConnect(SessionConnectEvent event){
        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(
                        event.getMessage()
                );

        String token = accessor.getFirstNativeHeader("token");
        String sessionId = accessor.getSessionId();
        System.out.println("Session id is :- "+sessionId);
        Optional<String> userId=userRepo.getUserName(token);
        if(userId.isEmpty()){
            throw new RuntimeException("Token is not valid");
        }
        userSer.registerUser(token,sessionId);

        accessor.getSessionAttributes().put("userId",userId.get().trim().toLowerCase());
        Map<String, Object> att=accessor.getSessionAttributes();
        String userid= (String) accessor.getSessionAttributes().get("userId");
        System.out.println("User id is :- "+userid);
    }

//    This event is used to handle the disconnect
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event){
        StompHeaderAccessor accessor=StompHeaderAccessor.wrap(event.getMessage());
        String sessionId=accessor.getSessionId();
        userSer.removeUser(sessionId);
    }
}
