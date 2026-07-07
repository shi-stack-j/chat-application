package com.shiv.chat_bakend.mapper;

import com.shiv.chat_bakend.dto.WebSocketEventResDto;
import com.shiv.chat_bakend.enums.WebSocketEventTypeEnum;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;

public class WebSocketEventMapper {
    public static <T> WebSocketEventResDto<T>  webSocketEventResDto(T payload , WebSocketEventTypeEnum webSocketEventTypeEnum){
        return  WebSocketEventResDto.<T>builder()
                .eventType(webSocketEventTypeEnum)
                .payload(payload)
                .timestamp(Timestamp.from(Instant.now()))
                .build();
    }
}
