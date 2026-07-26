package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.repository.MessageDeliveryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/test")
public class TestCon {
    @Autowired
    private  MessageDeliveryRepo messageDeliveryRepo;

    @GetMapping("/count")
    public ResponseEntity<?> getCount(@RequestParam("cId") Long cId,@RequestParam("uId")String uId){
        long count=messageDeliveryRepo.countUnreadMessagesByConversation(uId,cId);
        return ResponseEntity.ok(count);

    }
}
