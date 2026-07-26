package com.shiv.chat_bakend.security;


import com.shiv.chat_bakend.model.UserEn;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;



public class CustomUserDetails implements UserDetails {
    private final UserEn userEn;

    public CustomUserDetails(UserEn userEn){
        this.userEn=userEn;
    }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public @Nullable String getPassword() {
        return userEn.getPassword();
    }

    @Override
    public String getUsername() {
        return userEn.getUserId();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !userEn.isDeleted();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return userEn.isActive();
    }

    public String getNickName(){return userEn.getNickName();}

}
