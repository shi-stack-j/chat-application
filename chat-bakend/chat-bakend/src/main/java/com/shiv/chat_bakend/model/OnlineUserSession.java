package com.shiv.chat_bakend.model;


import lombok.*;
import org.springframework.web.socket.WebSocketSession;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class OnlineUserSession {
    private String userId;
    private String sessionId;
}
