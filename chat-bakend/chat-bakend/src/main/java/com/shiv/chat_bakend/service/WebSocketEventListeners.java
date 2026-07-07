package com.shiv.chat_bakend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Objects;

@Component
public class WebSocketEventListeners {
    @Autowired
    private TokenSer tokenSer;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    @Autowired
    private MessageDeliverySer messageDeliverySer;
    @Autowired
    private NotificationServ notificationServ;
//    This will manage the onConnect Event
    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String token = accessor.getFirstNativeHeader("token");
        boolean isTokenExists=tokenSer.isTokenExists(token);
        if(!isTokenExists){throw new RuntimeException("Temporary token not found");}
        String userName= tokenSer.getUserName(token);
        boolean isLoggedIn=onlinePresenceSer.isOnline(userName);
        if(isLoggedIn)throw new RuntimeException("Not allowed user Already present");
        String sessionId=accessor.getSessionId();
        boolean isCreated=onlinePresenceSer.saveOnlineUser(userName,sessionId);
        if(!isCreated)throw new RuntimeException("Internal Server error while creating the user");
        Objects.requireNonNull(accessor.getSessionAttributes()).put("userId",userName);
//        Marking all  messages as delivered
        messageDeliverySer.markAsDelivered(userName);
        tokenSer.removeToken(token);
        System.out.println("Saving User : " + userName);
        System.out.println("Session Id : " + sessionId);
        System.out.println("Online Users : " + onlinePresenceSer.isOnline(userName));
        System.out.println("Mapped User : " + onlinePresenceSer.getUserId(sessionId));
        System.out.println("Connect");
        notificationServ.notifyOnline(userName);
    }

//    After establishing the successful connection
    @EventListener
    public void afterConnected(SessionConnectedEvent event){
        System.out.println("Connected");
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId= accessor.getSessionId();
        String userId=onlinePresenceSer.getUserId(sessionId);
        System.out.println("Notifying Online "+userId);
        System.out.println("Connected Session : " + sessionId);
        System.out.println("Fetched User : " + onlinePresenceSer.getUserId(sessionId));
        notificationServ.notifyOnline(userId);
    }

//    This will manage the onDisconnect Event
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event){
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId=accessor.getSessionId();
        boolean isMapped=onlinePresenceSer.isSession(sessionId);
        if(!isMapped)throw new RuntimeException("Invalid sessionId");
        String userId=onlinePresenceSer.getUserId(sessionId);
//        Here is what we have to set the last seen
        onlinePresenceSer.removeOnlineUser(userId);
//        Informing all that user is offline
        notificationServ.notifyOffline(userId);

    }


}
