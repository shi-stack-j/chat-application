package com.shiv.chat_bakend.dto.message;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is use when someone sends the request to read the messages of the particular conversation
public class MessageReadReqDto {
    @NotNull(message = "Conversation id is not valid")
    @Min(value = 1,message = "Conversation id cannot be less then 1")
    private Long conversationId;
}
