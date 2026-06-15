package com.shiv.chat_bakend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageDto {
    private String messageId;
    private String sender;
    private String receiver;
    private String content;
    private String conversationId;
    private String createdAt;
}
