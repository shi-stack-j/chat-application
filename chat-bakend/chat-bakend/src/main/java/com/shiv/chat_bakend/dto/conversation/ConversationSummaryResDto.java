package com.shiv.chat_bakend.dto.conversation;


import com.shiv.chat_bakend.dto.user.UserResDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is the conversation summary dto this will returned when all conversation are fetched
public class ConversationSummaryResDto {
    @NotNull(message = "Conversation ID cannot be null")
    @NotBlank(message = "Conversation Id cannot be blank")
    private Long conversationId;
    @NotNull(message = "Receiver ID cannot be null")
    @NotBlank(message = "Receiver Id cannot be blank")
    private UserResDto receiver;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount=0L;
}
