package com.shiv.chat_bakend.dto;


import lombok.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VisibilityResponseDto {
    private Long id;
    private String userId;
    private Long conversationId;
    private LocalDateTime clearedAt;
}

