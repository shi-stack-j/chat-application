package com.shiv.chat_bakend.dto.user;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
//Description :- This is used when the last seen of the users check request is sent
public class OnlinePresenceResDto {
    private Long id;
    private String userId;
    private LocalDateTime lastSeen;
}
