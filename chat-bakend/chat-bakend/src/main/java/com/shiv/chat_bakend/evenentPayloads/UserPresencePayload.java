package com.shiv.chat_bakend.evenentPayloads;


import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserPresencePayload {
    private String userId;

    private boolean online;
}
