package com.shiv.chat_bakend.model;

import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ChatMessage {
    private String messageId;
    private String content;
    private String receiverId;
    private LocalDateTime sendAt;

}
