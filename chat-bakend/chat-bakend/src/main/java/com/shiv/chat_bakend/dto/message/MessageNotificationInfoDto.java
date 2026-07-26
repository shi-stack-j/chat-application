package com.shiv.chat_bakend.dto.message;


import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageNotificationInfoDto {
    private String senderId;
    private Long conversationId;
}
