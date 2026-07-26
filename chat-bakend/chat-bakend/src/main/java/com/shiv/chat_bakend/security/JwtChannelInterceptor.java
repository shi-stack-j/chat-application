package com.shiv.chat_bakend.security;

import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;


//This is the channel interceptor class it is used to remove intercept the every incoming request of the websocket from client to server
//And executes this channel interceptor
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {
    @Autowired
    private JwtService jwtSer;
    @Autowired
    private CustomUserDetailsService customUserDetailsService;
    @Override
    public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {
        System.out.println("Running the interceptor 1...");
        StompHeaderAccessor accesor= MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if(accesor==null)return message;
        System.out.println("Running the interceptor 2...");
        if(StompCommand.CONNECT.equals(accesor.getCommand())){
            String authHeader = accesor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Authorization header missing");
            }
            System.out.println("Running the interceptor 3...");
            String jwt = authHeader.substring(7);
            String username = jwtSer.extractUserName(jwt);
            CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);
            if (!jwtSer.validateToken(jwt, userDetails)) {
                throw new RuntimeException("Invalid JWT Token");
            }
            System.out.println("Authenticating the user while it is connecting to the websocket....");
            System.out.println("Token is :- "+jwt);
            Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accesor.setUser(authentication);
            System.out.println("Running the interceptor 5...");
        }
        return message;
    }
}
