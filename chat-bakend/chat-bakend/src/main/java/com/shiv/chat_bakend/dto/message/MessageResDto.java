package com.shiv.chat_bakend.dto.message;


import com.shiv.chat_bakend.dto.reaction.MessageReactionDto;
import com.shiv.chat_bakend.enums.MessageStatusEnum;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
//Description :- This is used to return the message response to the frontend
public class MessageResDto {
    private Long messageId;
    private Long conversationId;
    private String content;
    private String senderId;
    private boolean deletedFromEveryOne;
    private boolean isEdited;
    private LocalDateTime editedAt;
    private LocalDateTime receivedAt;
    private MessageStatusEnum status;
    private List<MessageReactionDto> reactions;
}
