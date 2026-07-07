package com.shiv.chat_bakend.evenentPayloads;

import com.shiv.chat_bakend.enums.MessageStatusEnum;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageStatusPayload {
    private Long messageId;

    private Long conversationId;

    private MessageStatusEnum status;
}
