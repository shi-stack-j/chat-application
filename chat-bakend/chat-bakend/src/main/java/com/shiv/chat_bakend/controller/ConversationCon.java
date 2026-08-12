package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.dto.conversation.ConversationReqDto;
import com.shiv.chat_bakend.service.ConversationSer;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conversation")
@Slf4j
//Description :- This method is used to manage all the requests related tot he conversation
public class ConversationCon {

    @Autowired
    private ConversationSer conversationSer;

//    Checked
//    This method will return the conversation if exists otherwise it create the new conversation
    @PostMapping("/create")
    public ResponseEntity<?> getOrCreateConversation(
            @Valid @RequestBody ConversationReqDto reqDto
    ){
        log.info("Calling the Get OR Create Conversation controller");
        if(reqDto==null )return ResponseEntity.badRequest().body("Conversation object is not valid");
        return  conversationSer.getOrCreateConversation(reqDto);
    }
//    This is used to return the conversations of the particular user
    @GetMapping("/get")
    public ResponseEntity<?> getUserConversations(
            @PageableDefault(
                    page = 0,
                    size = 20,
                    sort = "lastMessageAt",
                    direction = Sort.Direction.DESC
            )Pageable pageable
    ){
        return conversationSer.getUserConversations(pageable);
    }
//    This method is used to handle request for the all conversation marked ro fetch user message
//    Checked
    @GetMapping("/get/conversationSummary")
    public ResponseEntity<?> getConversationSummary(
        @PageableDefault(
                page = 0,
                size = 20,
                sort = "lastMessageAt",
                direction = Sort.Direction.DESC
        )Pageable pageable
    ){
        log.info("Calling the Conversation Conversation summary controller");
        return conversationSer.getConversationSummary(pageable);
    }

}
