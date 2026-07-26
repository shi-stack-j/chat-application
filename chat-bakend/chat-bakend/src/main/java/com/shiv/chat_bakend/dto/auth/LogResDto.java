package com.shiv.chat_bakend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This dto is used to return the response from the backend after being loggedIn
public class LogResDto {
    private String jwtToken;
}
