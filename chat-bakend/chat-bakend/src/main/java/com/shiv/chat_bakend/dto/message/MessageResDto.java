package com.shiv.chat_bakend.dto.message;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is used to return the message response to the frontend
public class MessageResDto {
    private Long conversationId;
    private String content;
    private String senderId;
    private LocalDateTime receivedAt;
}
