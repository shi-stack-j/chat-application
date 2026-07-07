package com.shiv.chat_bakend.mapper;

import com.shiv.chat_bakend.dto.user.OnlinePresenceResDto;
import com.shiv.chat_bakend.model.OnlinePresenceEn;

public class OnlinePresenceMapper {
    public static OnlinePresenceResDto toOnlinePresenceResDto(OnlinePresenceEn onlinePresenceEn){
        OnlinePresenceResDto resDto=new OnlinePresenceResDto();
        resDto.setId(onlinePresenceEn.getId());
        resDto.setLastSeen(onlinePresenceEn.getLastSeenAt());
        resDto.setUserId(onlinePresenceEn.getUser().getUserId());
        return  resDto;
    }
}
