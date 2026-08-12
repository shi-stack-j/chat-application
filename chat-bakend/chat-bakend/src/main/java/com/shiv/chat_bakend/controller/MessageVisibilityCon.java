package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.dto.MessageDeleteReqDto;
import com.shiv.chat_bakend.service.MessageVisibilitySer;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MessageVisibilityCon {
    @Autowired
    private MessageVisibilitySer messageVisibilitySer;
    /**
     * Delete one or more messages only for the current user.
     *
     * DELETE /api/messages/delete-for-me
     */
    @DeleteMapping("/delete-for-me")
    public ResponseEntity<?> deleteForMe(
            @Valid @RequestBody MessageDeleteReqDto deleteReqDto
    ) {
        return messageVisibilitySer.deleteFromMySide(deleteReqDto);
    }

}
