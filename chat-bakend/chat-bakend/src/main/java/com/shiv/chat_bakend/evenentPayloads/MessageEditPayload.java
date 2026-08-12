package com.shiv.chat_bakend.evenentPayloads;


import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageEditPayload {
    private Long messageId;

    private Long conversationId;

    private String content;

    private LocalDateTime editedAt;

}
