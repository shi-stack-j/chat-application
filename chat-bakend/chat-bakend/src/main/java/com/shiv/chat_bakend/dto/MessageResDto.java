package com.shiv.chat_bakend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageResDto {
    private String content;
    private String senderId;
    private LocalDateTime receivedAt;
}
