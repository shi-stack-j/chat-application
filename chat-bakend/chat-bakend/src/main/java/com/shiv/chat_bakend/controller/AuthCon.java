package com.shiv.chat_bakend.controller;

import com.shiv.chat_bakend.dto.auth.LogReqDto;
import com.shiv.chat_bakend.dto.auth.RegisterReqDto;
import com.shiv.chat_bakend.service.AuthSer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;


//Description :- This is the controller that will handle all login and register flow
@RestController
@RequestMapping("/auth")
public class AuthCon {
    @Autowired
    private AuthSer authSer;
//    This method is used to manage the request for the register
//    Checked
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterReqDto reqDto){
        if(reqDto==null)return ResponseEntity.badRequest().body("Provide valid registration details");
        return authSer.register(reqDto);
    }
//    This method is used to manage the request for the login
//    Checked
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LogReqDto reqDto,HttpServletRequest servletRequest){
        if(reqDto==null)return ResponseEntity.badRequest().body("Provide valid login details");
        return authSer.login(reqDto,servletRequest);
    }

    @GetMapping("/health")
//    Checked
    public String checkHealth(){
        return "Server is running";
    }

    @GetMapping("/session")
    public String getSession(HttpServletRequest servletRequest){
        HttpSession session=servletRequest.getSession();
        Integer count=(Integer) session.getAttribute("count");
        if(count==null)count=1;
        else count++;
        session.setAttribute("count",count);
        return "SessionId : " + session.getId() + " Count : " + count;
    }
}
