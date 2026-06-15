package com.shiv.chat_bakend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LogResDto {
    private String userId;
    private String avatarUrl;
    private String nickName;
}
