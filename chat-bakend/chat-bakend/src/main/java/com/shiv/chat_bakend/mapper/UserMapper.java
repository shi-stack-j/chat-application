package com.shiv.chat_bakend.mapper;


import com.shiv.chat_bakend.dto.user.UserResDto;
import com.shiv.chat_bakend.model.UserEn;

public class UserMapper {
    public static UserResDto toUserResDto(UserEn userEn,boolean isOnline){
        UserResDto resDto=new UserResDto();
        resDto.setUserId(userEn.getUserId());
        resDto.setAvatarUrl(userEn.getAvatarUrl());
        resDto.setNickName(userEn.getNickName());
        resDto.setOnline(isOnline);
        resDto.setRoleEnum(userEn.getRole());
        return resDto;
    }
}
