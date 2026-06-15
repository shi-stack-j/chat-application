package com.shiv.chat_bakend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConversationDto {
    private Long conversationId;
    private String user_one;
    private String user_two;
}
