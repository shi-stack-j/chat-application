package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.service.AuthSer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthCon {
    @Autowired
    private AuthSer authSer;
    @GetMapping("/login/{userID}")
    public ResponseEntity<?> userLogin(@PathVariable String userID){
        return authSer.handleLogin(userID);
    }
}
