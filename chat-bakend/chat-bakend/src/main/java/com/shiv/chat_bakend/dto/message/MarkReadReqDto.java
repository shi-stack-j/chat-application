package com.shiv.chat_bakend.dto.message;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
//Description :- This is use when frontend sends the request to mark the messages of the particular conversation as read
public class MarkReadReqDto {
    @NotNull(message = "Conversation id cannot be null")
    @Min(value = 1, message = "ConversationId must be greater then 1")
    private Long conversationId;
}
