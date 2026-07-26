package com.shiv.chat_bakend.service;
import com.shiv.chat_bakend.dto.user.UserResDto;
import com.shiv.chat_bakend.mapper.UserMapper;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.UserRep;
import com.shiv.chat_bakend.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUserSer {


    @Autowired
    private UserRep userRep;

//    Checked
    public CustomUserDetails getCurrentUser(){
        if(SecurityContextHolder.getContext().getAuthentication()==null){
            System.out.println("User is authenticated not ");
            throw new RuntimeException("User is not authenticated ");
        }
        return (CustomUserDetails)SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

//    Checked
    public String getUserId(){
        return getCurrentUser().getUsername().trim().toLowerCase();
    }

//    Checked
    public UserResDto getUser(){
        String userId=getUserId();
        Optional<UserEn> userEn=userRep.findByUserId(userId);
        if(userEn.isEmpty())throw new RuntimeException("User not found with id :-"+userId);
        return UserMapper.toUserResDto(userEn.get(),true);

    }

}
