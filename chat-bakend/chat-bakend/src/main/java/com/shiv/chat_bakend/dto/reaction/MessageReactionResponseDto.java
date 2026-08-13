package com.shiv.chat_bakend.dto.reaction;

import com.shiv.chat_bakend.enums.ReactionActionEnum;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageReactionResponseDto {

    @NotNull
    private Long conversationId;
    @NotNull
    private Long messageId;
    @NotNull
    private String userId;
    private String emoji;
    @NotNull
    private ReactionActionEnum action;
}
