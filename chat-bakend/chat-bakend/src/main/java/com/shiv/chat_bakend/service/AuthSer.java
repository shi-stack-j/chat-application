package com.shiv.chat_bakend.service;

import com.shiv.chat_bakend.dto.auth.LogReqDto;
import com.shiv.chat_bakend.dto.auth.LogResDto;
import com.shiv.chat_bakend.dto.auth.RegisterReqDto;
import com.shiv.chat_bakend.mapper.LoginMapper;
import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.UserRep;
import com.shiv.chat_bakend.security.CustomUserDetails;
import com.shiv.chat_bakend.security.CustomUserDetailsService;
import com.shiv.chat_bakend.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Principal;

@Service
public class AuthSer {

    @Autowired
    private UserRep userRep;

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private OnlinePresenceSer onlinePresenceSer;
//    Checked
    public ResponseEntity<?> login(LogReqDto loginDetails, HttpServletRequest servletRequest){
        String userId=loginDetails.getUserId();
        String password=loginDetails.getPassword();
        if(userId==null || userId.isBlank() || password==null || password.isBlank()){
            throw new RuntimeException("UserName or password is not correct");
        }
        boolean isOnline=onlinePresenceSer.isOnline(userId);
        if (isOnline)return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Already loggedIn plz logout first to logIn again....");
        UsernamePasswordAuthenticationToken authToken=new UsernamePasswordAuthenticationToken(userId,password);
        Authentication authentication=authenticationManager.authenticate(authToken);
        String jwtToken=jwtService.generateToken((CustomUserDetails) authentication.getPrincipal());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        LogResDto logResDto=LoginMapper.logResDto(jwtToken);
        return ResponseEntity.ok(logResDto);
    }
//    Checked
    @Transactional
    public ResponseEntity<?> register(RegisterReqDto registerDetails){
        if(registerDetails==null)return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Register Details are required");
        String userId=registerDetails.getUserId();
        String password=registerDetails.getPassword();
        String nickName=registerDetails.getNickName();
        String avatarUrl=registerDetails.getAvatarUrl();
        if(userId==null || userId.isBlank() || password==null || password.isBlank() || nickName==null || nickName.isBlank()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Provide valid Details");
        }
        registerDetails.setPassword(passwordEncoder.encode(password));
        UserEn userEn=LoginMapper.toUserEn(registerDetails);
        userRep.save(userEn);
        return ResponseEntity.status(HttpStatus.CREATED).body("User Created Successfully");
    }

}
