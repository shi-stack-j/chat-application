package com.shiv.chat_bakend.dto.conversation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is used to return the conversation to the frontend
public class ConversationDto {
    private Long conversationId;
    private String user_one;
    private String user_two;
    private LocalDateTime lastMessage;
}
