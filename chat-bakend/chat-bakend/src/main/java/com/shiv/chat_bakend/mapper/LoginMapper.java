package com.shiv.chat_bakend.mapper;


import com.shiv.chat_bakend.dto.auth.LogResDto;
import com.shiv.chat_bakend.dto.auth.RegisterReqDto;
import com.shiv.chat_bakend.model.UserEn;

public class LoginMapper {
    public static LogResDto logResDto(UserEn userEn){
        LogResDto resDto=new LogResDto();
        resDto.setUserId(userEn.getUserId());
        resDto.setNickName(userEn.getNickName());
        String url= userEn.getAvatarUrl()!=null? userEn.getAvatarUrl() : "";
        resDto.setAvatarUrl(url);
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
        return userEn;
    }
}
