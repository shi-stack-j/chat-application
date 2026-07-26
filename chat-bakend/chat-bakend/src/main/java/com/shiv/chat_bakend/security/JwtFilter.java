package com.shiv.chat_bakend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;
    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
//        Step 1 :- Extracting the Authorization headers from the request
        String header=request.getHeader(HttpHeaders.AUTHORIZATION);
//        Step 2 :- Checking that Authorization header exists and Token exists or not
        if(header==null || !header.startsWith("Bearer ")){
            filterChain.doFilter(request,response);
            return;
        }
//        Step 3 :- Extracting the token from the headers
        String token= header.substring(7);
//        Step 4 :- Extracting the username from the token
        String username=jwtService.extractUserName(token);
//        step 5 :- Checking that username exists and also that already authenticated or not
        if(username!=null && SecurityContextHolder.getContext().getAuthentication()==null){
//            Step 6 :- Extracting the user details from the db
            CustomUserDetails customUserDetails=(CustomUserDetails) customUserDetailsService.loadUserByUsername(username);
//            Step 7 :- Checking the token is valid or not
            if(jwtService.validateToken(token,customUserDetails)){
//                Step 8 :- Creating the authentication token
                UsernamePasswordAuthenticationToken authenticationToken=new UsernamePasswordAuthenticationToken(customUserDetails,null,customUserDetails.getAuthorities());
//                Step 9 :- Validating the authentication token
             authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
//                Step 10 :- Setting the authentication object into the Context holder
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }
//        Step 11 :- Passing the request to next filer
        filterChain.doFilter(request,response);
    }
}
