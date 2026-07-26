package com.shiv.chat_bakend.dto.ack;

import com.shiv.chat_bakend.enums.MessageStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ReadAckReqDto {
    @NotNull
    private Long conversationId;
}
