package com.shiv.chat_bakend.security;

import com.shiv.chat_bakend.model.UserEn;
import com.shiv.chat_bakend.repository.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;


@Component
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRep userRep;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        if (username == null || username.isBlank() || username.length() < 3) {
            throw new UsernameNotFoundException("Invalid username");
        }

        UserEn userEn = userRep.findByUserId(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with username: " + username));
        if(!userEn.isActive() || userEn.isDeleted())throw new UsernameNotFoundException("User not found");
        return new CustomUserDetails(userEn);
    }
}
