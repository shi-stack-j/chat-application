package com.shiv.chat_bakend.dto.conversation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
//Description :- This is used to define the structure of the request to fetch the conversation
public class ConversationReqDto {
    @NotNull(message = "receiver id cannot be null")
    @Size(min = 3,message = "Receiver id should not be less then length 3")
    private String receiverId;
}
