package com.shiv.chat_bakend.mapper;


import com.shiv.chat_bakend.dto.auth.LogResDto;
import com.shiv.chat_bakend.dto.auth.RegisterReqDto;
import com.shiv.chat_bakend.enums.RoleEnum;
import com.shiv.chat_bakend.model.UserEn;

public class LoginMapper {
    public static LogResDto logResDto(String token){
        LogResDto resDto=new LogResDto();
        resDto.setJwtToken(token);
        return resDto;
    }
    public static UserEn toUserEn(RegisterReqDto reqDto){
        UserEn userEn=new UserEn();
        userEn.setUserId(reqDto.getUserId());
        String url= reqDto.getAvatarUrl()!=null? reqDto.getAvatarUrl() : "";
        reqDto.setAvatarUrl(url);
        userEn.setAvatarUrl(url);
        userEn.setPassword(reqDto.getPassword());

        userEn.setNickName(reqDto.getNickName());
        userEn.setRole(RoleEnum.USER_ROLE);
        return userEn;
    }
}
