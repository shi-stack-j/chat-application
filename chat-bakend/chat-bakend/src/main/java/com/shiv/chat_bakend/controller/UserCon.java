package com.shiv.chat_bakend.controller;


import com.shiv.chat_bakend.dto.SearchResDto;
import com.shiv.chat_bakend.service.UserSer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserCon {

    @Autowired
    private UserSer userSer;
    @GetMapping("/get/{userID}")

    public ResponseEntity<SearchResDto> getUser(@PathVariable String userID){
        SearchResDto resDto=userSer.getUser(userID);
        return ResponseEntity.ok(resDto);
    }
}
