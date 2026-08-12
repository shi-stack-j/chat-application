package com.shiv.chat_bakend.evenentPayloads;


import lombok.Getter;

@Getter
public class UserBlockedEvent {
    private final String blockerId;
    private final String blockedId;
    public UserBlockedEvent(String blockedId,String blockerId){
        this.blockedId=blockedId;
        this.blockerId=blockerId;
        System.out.println("Calling the contructor of UserBlockEvent..........");
    }
}
