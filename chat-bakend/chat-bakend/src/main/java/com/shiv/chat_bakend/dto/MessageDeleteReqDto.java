package com.shiv.chat_bakend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MessageDeleteReqDto {
    private Set<Long> deleteMessageIds=new HashSet<>();
}
