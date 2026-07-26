package com.shiv.chat_bakend.controller;



import com.shiv.chat_bakend.service.UserSer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserCon {
    @Autowired
    private UserSer userSer;
//    Checked
//    This method is used to return the user
    @GetMapping("/get/{userId}")
    public ResponseEntity<?> getUser(@PathVariable String userId){
        if(userId==null ||  userId.isBlank() || userId.length()<3)return ResponseEntity.badRequest().body("Userid is not Valid ");
        return userSer.getUser(userId);
    }
    @GetMapping("/current/user")
    public ResponseEntity<?> currentUser(HttpServletRequest servletRequest){
        System.out.println("Session id :- "+servletRequest.getSession().getId());
        return userSer.getCurrentUser();
    }
}
