package com.shiv.chat_bakend.evenentPayloads;


import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageDeletePayload {
    private Long messageId;
    private Long conversationId;
    private LocalDateTime deletedAt;
    private String content;
}
