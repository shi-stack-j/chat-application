package com.shiv.chat_bakend.evenentPayloads;

import lombok.Getter;

@Getter
public class UserUnBlockEvent {

    private final String blockerId;
    private final String blockedId;
    public UserUnBlockEvent(String blockedId,String blockerId){
        this.blockedId=blockedId;
        this.blockerId=blockerId;
    }
}
