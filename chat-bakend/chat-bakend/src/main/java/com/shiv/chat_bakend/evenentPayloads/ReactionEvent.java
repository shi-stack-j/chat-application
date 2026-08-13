package com.shiv.chat_bakend.evenentPayloads;


import com.shiv.chat_bakend.dto.reaction.MessageReactionResponseDto;
import lombok.Getter;

@Getter
public class ReactionEvent {
    private final MessageReactionResponseDto reactionResponseDto;
    private final String currentUserID;
    public ReactionEvent(MessageReactionResponseDto responseDto,String currentUserID){
        this.reactionResponseDto=responseDto;
        this.currentUserID=currentUserID;
    }

}
