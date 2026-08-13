package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.dto.reaction.MessageReactionReqDto;
import com.shiv.chat_bakend.service.MessageReactionSer;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reactions")
public class MessageReactionCon {

    @Autowired
    private MessageReactionSer messageReactionSer;

    @PostMapping("/add-update")
    public ResponseEntity<?> addOrUpdateReaction(
            @Valid @RequestBody MessageReactionReqDto reactionReqDto
    ) {
        return messageReactionSer.addOrUpdateReaction(reactionReqDto);
    }

    @DeleteMapping("/remove/{messageId}")
    public ResponseEntity<?> deleteReaction(
            @PathVariable Long messageId
    ) {
        return messageReactionSer.deleteReaction(messageId);
    }
}
