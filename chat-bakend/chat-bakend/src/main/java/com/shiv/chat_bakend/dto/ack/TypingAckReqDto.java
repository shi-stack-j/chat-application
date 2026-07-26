package com.shiv.chat_bakend.dto.ack;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TypingAckReqDto {
    private Long conversationId;
    private boolean isTyping;
}
