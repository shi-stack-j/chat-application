package com.shiv.chat_bakend.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;


@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserMod {
    @NotBlank(message = "UserCon id cannot be blank")
    private String userID;
    @NotBlank(message = "Session id is not valid")
    private String sessionID;
    private final LocalDateTime createdAt=LocalDateTime.now();
    private boolean isOnline=true;
}
