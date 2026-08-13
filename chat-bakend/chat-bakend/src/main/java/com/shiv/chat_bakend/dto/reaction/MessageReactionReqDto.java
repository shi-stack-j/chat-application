package com.shiv.chat_bakend.dto.reaction;


import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageReactionReqDto {
    @NotBlank
    @Size(max = 32)
    private String emoji;
    @NotNull
    private Long messageId;
}
