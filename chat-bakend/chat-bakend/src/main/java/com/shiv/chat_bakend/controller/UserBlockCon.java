package com.shiv.chat_bakend.controller;


import com.shiv.chat_bakend.service.UserBlockSer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/userBlock")
public class UserBlockCon {
    @Autowired
    private UserBlockSer userBlockSer;

    // Block User
    @PostMapping("/{blockedUserId}")
    public ResponseEntity<?> blockUser(
            @PathVariable String blockedUserId
    ) {
        return userBlockSer.blockUser(blockedUserId);
    }

    // Unblock User
    @DeleteMapping("/{blockedUserId}")
    public ResponseEntity<?> unblockUser(
            @PathVariable String blockedUserId
    ) {
        return userBlockSer.unblockUser(blockedUserId);
    }
}
