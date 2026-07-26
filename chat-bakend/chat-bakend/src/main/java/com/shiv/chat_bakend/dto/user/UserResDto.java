package com.shiv.chat_bakend.dto.user;


import com.shiv.chat_bakend.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is used when the search request for the particular user hits
public class UserResDto {
    private String userId;
    private String nickName;
    private String avatarUrl;
    private boolean isOnline;
    private RoleEnum roleEnum;
}
