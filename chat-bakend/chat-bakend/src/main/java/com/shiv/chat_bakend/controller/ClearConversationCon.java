package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.service.ConversationVisibilitySer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clearConversation")
public class ClearConversationCon {
    @Autowired
    private ConversationVisibilitySer visibilitySer;

    @PostMapping("/{conversationId}/clear")
    public ResponseEntity<?> clearConversation(
            @PathVariable Long conversationId
    ) {
        return visibilitySer.clearConversation(conversationId);
    }

    @GetMapping("/{conversationId}/clear")
    public ResponseEntity<?> getClearConversation(
            @PathVariable Long conversationId
    ) {
        return visibilitySer.getClearConversation(conversationId);
    }
}
