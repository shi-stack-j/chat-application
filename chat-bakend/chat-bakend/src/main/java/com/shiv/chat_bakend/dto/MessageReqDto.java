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
public class MessageReqDto {
    private String receiver;
    private String content;
    private LocalDateTime sendAt;
}
