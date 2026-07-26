package com.shiv.chat_bakend.dto.message;


import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
//Description :- This is used to return the message response to the frontend
public class MessageResDto {
    private Long conversationId;
    private String content;
    private String senderId;
    private LocalDateTime receivedAt;
}
