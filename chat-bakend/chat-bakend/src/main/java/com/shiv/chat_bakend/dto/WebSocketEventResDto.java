package com.shiv.chat_bakend.dto;


import com.shiv.chat_bakend.enums.WebSocketEventTypeEnum;
import lombok.*;

import java.sql.Timestamp;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketEventResDto<T> {
    private WebSocketEventTypeEnum eventType;
    private T payload;
    private Timestamp timestamp;
}
