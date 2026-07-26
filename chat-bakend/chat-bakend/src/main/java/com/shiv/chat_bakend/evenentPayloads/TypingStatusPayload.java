package com.shiv.chat_bakend.evenentPayloads;


import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TypingStatusPayload {
    private Long conversationId;

    private String senderId;

    private boolean typing;
}
