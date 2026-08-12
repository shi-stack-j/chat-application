package com.shiv.chat_bakend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListeners {

    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
    @Autowired
    private MessageDeliverySer messageDeliverySer;
    @Autowired
    private NotificationServ notificationServ;
//    This will manage the onConnect Event
//    Here we will se that what happens when someone send the connection request
//    First the interceptor will check for the authentication and will authenticate the user
    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
//        Here we are extracting the authenticated userId and session id
        String userId=accessor.getUser().getName();
        String sessionId=accessor.getSessionId();
//        Here we are saving the user in the online users map
        boolean isCreated=onlinePresenceSer.saveOnlineUser(sessionId,userId);
        if(!isCreated)throw new RuntimeException("Internal Server error while creating the user");
//        Marking all  messages as delivered
        messageDeliverySer.markAsDelivered(userId);
        System.out.println("Session Id : " + sessionId);
        System.out.println("Online Users : " + onlinePresenceSer.isOnline(userId));
        System.out.println("Connect");
        notificationServ.notifyOnline(userId);
    }
//    This will manage the onDisconnect Event
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event){
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId=accessor.getUser().getName();
        String sessionId=accessor.getSessionId();
//        Here is what we have to set the last seen
        onlinePresenceSer.removeOnlineUser(userId);
//        Informing all that user is offline
        notificationServ.notifyOffline(userId);
    }
}
