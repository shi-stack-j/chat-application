package com.shiv.chat_bakend.dto.message;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageEditReqDto {
    @NotNull(message = "Id cannot be null")
    @Positive(message = "Id cannot be negative ")
    private Long messageId;
    @NotNull(message = "New Message must required")
    @NotBlank(message = "Message cannot be blank")
    private String newContent;
}
