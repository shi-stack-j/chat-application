package com.shiv.chat_bakend.dto;


import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class LoginResDto {
    private boolean success;
    private String userId;
    private String nickname;
    private String token;
}
