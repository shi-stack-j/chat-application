package com.shiv.chat_bakend.dto.reaction;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageReactionDto {
    private String userId;
    private String emoji;
}
