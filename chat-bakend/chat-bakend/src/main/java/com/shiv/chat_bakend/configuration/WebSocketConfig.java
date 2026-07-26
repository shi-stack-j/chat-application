package com.shiv.chat_bakend.configuration;

import com.shiv.chat_bakend.security.JwtChannelInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtChannelInterceptor jwtChannelInterceptor;
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        System.out.println(">>>>>>>> REGISTERING WS ENDPOINTS <<<<<<<<");
        registry
//                This is where the user will establish the connection
                .addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns("http://localhost:5173")
                .withSockJS();
        registry
                .addEndpoint("/ws");
//                .setAllowedOrigins("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry
//                This is where the user will send the message
                .setApplicationDestinationPrefixes(
                        "/app"
                )
                .setUserDestinationPrefix("/user")
//                This is where the application will send the message
                .enableSimpleBroker(
                        "/topic",
                        "/queue"
                );
    }

}
