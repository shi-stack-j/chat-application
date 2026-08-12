package com.shiv.chat_bakend.dto.ack;


import com.shiv.chat_bakend.enums.MessageStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.*;


//This is used to sent the acknowledgement back to the sender after successfully saving the message into db
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SentAckResDto {
    @NotNull
    private Long messageId;
    @NotNull
    private String messageTempId;
    @NotNull
    private MessageStatusEnum messageStatus;
    @NotNull
    private Long conversationId;

}
