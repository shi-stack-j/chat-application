package com.shiv.chat_bakend.dto.message;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is used when frontend sends the request to send the message to the user
public class MessageReqDto {
    @Size(min = 3 , message = "Size must be greater then 3 ")
    private String receiver;
    @NotNull
    private String content;
    @NotNull
    private String tempMessageId;
    @CreationTimestamp
    private LocalDateTime sendAt;
}
