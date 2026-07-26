package com.shiv.chat_bakend.dto.ack;


import com.shiv.chat_bakend.enums.MessageStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class DeliveryAckReqDto {
    @NotNull
    private Long messageId;
}
